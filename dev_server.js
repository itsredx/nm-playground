// ── Nizam & Mantiq WebAssembly Studio Development Server ───────────────
// Zero-dependency HTTP server with live WASM compiler bridge for .nz & .mq.

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const PORT = process.env.PORT || 8080;
const ROOT_DIR = path.resolve(__dirname);
const PROJECT_DIR = path.resolve(__dirname, "..");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── API: POST /api/compile ───────────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/compile") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const code = payload.code || "";
        const lang = (payload.lang || "").toLowerCase();
        const filename = payload.filename || "";

        // Determine extension (.mq vs .nz)
        const isMantiq = lang === "mantiq" || filename.endsWith(".mq") || code.includes("class ") || code.includes("interface ") || code.includes("extends ");
        const ext = isMantiq ? ".mq" : ".nz";
        const id = Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        const fullSrc = path.join(os.tmpdir(), `temp_user_code_${id}${ext}`);
        const fullOut = path.join(os.tmpdir(), `temp_user_code_${id}.wasm`);

        fs.writeFileSync(fullSrc, code, "utf-8");

        let cmd = `./nizam_wasi.js stage4/nizam.wasm build ${fullSrc} -o ${fullOut} --target wasm32-wasi --lib-dir mantiq`;
        let output = "";
        let compiled = false;
        try {
          output = execSync(cmd, { cwd: PROJECT_DIR, encoding: "utf-8", stdio: "pipe" });
          compiled = fs.existsSync(fullOut);
        } catch (wasmErr) {
          // If stage4 wasm bridge hit an error, fallback to native compiler
          const nativeCmd = `./mantiq/nizam build ${fullSrc} -o ${fullOut} --target wasm32-wasi`;
          try {
            output = execSync(nativeCmd, { cwd: PROJECT_DIR, encoding: "utf-8", stdio: "pipe" });
            compiled = fs.existsSync(fullOut);
          } catch (nativeErr) {
            const stdout = (nativeErr.stdout || wasmErr.stdout || "").toString();
            const stderr = (nativeErr.stderr || wasmErr.stderr || "").toString();
            let errMsg = "";
            if (stdout.trim().length > 0) errMsg += stdout;
            if (stderr.trim().length > 0) {
              if (errMsg.length > 0 && !errMsg.endsWith("\n")) errMsg += "\n";
              errMsg += stderr;
            }
            if (errMsg.trim().length === 0) {
              errMsg = nativeErr.message || wasmErr.message || "Unknown compilation error";
            }
            try { fs.unlinkSync(fullSrc); } catch (_) {}
            try { fs.unlinkSync(fullOut); } catch (_) {}
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              success: false,
              lang: isMantiq ? "mantiq" : "nizam",
              filename: `temp_user_code${ext}`,
              error: errMsg
            }));
            return;
          }
        }

        if (compiled && fs.existsSync(fullOut)) {
          const wasmBytes = fs.readFileSync(fullOut);
          try { fs.unlinkSync(fullSrc); } catch (_) {}
          try { fs.unlinkSync(fullOut); } catch (_) {}
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            success: true,
            lang: isMantiq ? "mantiq" : "nizam",
            filename: `temp_user_code${ext}`,
            wasmBase64: wasmBytes.toString("base64"),
            compilerOutput: output
          }));
          return;
        }
        try { fs.unlinkSync(fullSrc); } catch (_) {}
        try { fs.unlinkSync(fullOut); } catch (_) {}
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: output || "Compilation produced no output binary." }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // ── Static File Server ───────────────────────────────────────────────
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";

  const filePath = path.join(ROOT_DIR, reqPath);

  // Security: Prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`Not Found: ${reqPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Cache-Control": "no-cache"
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[Nizam WASM Studio] Server running at http://127.0.0.1:${PORT}`);
});
