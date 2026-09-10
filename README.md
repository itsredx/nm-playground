# Nizam & Mantiq WebAssembly Studio

An in-browser WebAssembly IDE and WASI Preview 1 execution studio for the **Nizam** and **Mantiq** programming languages. Features syntax highlighting, LLVM IR inspection, real-time memory hexadecimal viewer, system call telemetry, and dual-mode execution (client-side precompiled WASM + live cloud compilation).

Live URL: [https://playground-two-sable.vercel.app/](https://playground-two-sable.vercel.app/)

---

## 1. Architecture Overview

```
User Browser (Playground UI)
       │
       ├─► Static Assets (Vercel Edge CDN)
       │     ├─ index.html
       │     ├─ studio.js (UI state & editor engine)
       │     ├─ highlighter.js (Dual-syntax tokenizer)
       │     ├─ wasi_browser.js (In-browser WASI Preview 1 VM)
       │     └─ wasm/*.wasm (12 precompiled demo binaries)
       │
       ├─► Client-Side Execution (0ms latency, zero server required)
       │     └─ Instant execution of precompiled demos in WebAssembly VM
       │
       └─► Live Compilation (POST /api/compile)
             └─ Proxied by Vercel Edge to external Compiler Worker (Render / Cloud Run)
                 └─ Native Linux 'nizam' binary compiles code in ~0.4s (Peak RAM: ~41MB)
```

---

## 2. Key Features

- **In-Browser WASI Preview 1 VM (`wasi_browser.js`):** Pure JavaScript implementation of the WebAssembly System Interface (WASI) preview 1. Supports `fd_write`, `args_get`, `clock_time_get`, and process exits directly in the browser.
- **Dual-Language Studio:** Switch seamlessly between Nizam (`.nz`) and Mantiq (`.mq`) syntax modes.
- **12 Precompiled Demos:** Complete coverage of language features running 100% client-side with 0ms compilation overhead:
  1. Hello WASI (Console printing)
  2. Numbers & Loops (Collatz conjecture)
  3. String Manipulation (Heap dynamic strings)
  4. Memory Allocation (Dynamic pointer arrays)
  5. WASI Clock & Benchmark (Microsecond timer telemetry)
  6. Factorial Recursion (Custom user demonstration)
  7. Compiler Error Diagnostics (TrueColor ANSI error spans)
  8. Mantiq Classes & Interfaces (OOP, inheritance, `super()` delegation)
  9. Closures & Lambdas (Lexical environment heap capture)
  10. String Interpolation (Format expressions)
  11. List Comprehensions (Filtering and mapping syntax)
  12. Cooperative Async (Coroutines & message-passing actor channels)
- **Editor Dirty-State Detection:** Automatically identifies when source code has been modified (`• Modified` indicator) and informs the user when live cloud compilation is required.
- **Linear Memory Hex Viewer:** Live inspection of 64KB WASM memory pages with ASCII sidebar and page pagination.
- **Performance & Telemetry Panel:** Real-time metrics tracking execution time, memory allocation, active page count, and WASI syscall frequency.

---

## 3. Vercel Static Edge Deployment

To achieve instant global delivery and zero hosting costs, the studio is deployed to **Vercel** as a pure static edge site:

### Eliminating the Serverless Function Trap
In default zero-config Node setups, Vercel automatically converts root files named `app.js`, `index.js`, or `server.js` into server-side AWS Lambda functions (`/var/task/app.cjs`). Because browser DOM globals (`document`, `window`) do not exist in Node, this caused `ReferenceError: document is not defined` crashes.

**Resolution Applied:**
- Renamed the main frontend script to `studio.js`.
- Removed `package.json` from the production deployment.
- Added `.vercelignore` to exclude local dev server scripts (`dev_server.js`).
- Explicitly configured `"framework": null` in `vercel.json`.

### Cross-Origin Isolation Headers
`vercel.json` applies required isolation headers for `.wasm` files:
```json
{
  "headers": [
    {
      "source": "/wasm/(.*)\\.wasm",
      "headers": [
        { "key": "Content-Type", "value": "application/wasm" },
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

---

## 4. Live Compiler Service Integration

When a user writes custom code or modifies existing demos, clicking **Compile & Run** sends a `POST` request to `/api/compile`.

`vercel.json` transparently proxies this route to the live compiler backend on Render:
```json
{
  "rewrites": [
    {
      "source": "/api/compile",
      "destination": "https://compiler-service-uve5.onrender.com/compile"
    }
  ]
}
```

### Backend Memory Optimization (1,007MB ➔ 41MB)
The compiler backend runs a native Linux x86-64 ELF `nizam` binary. By eliminating heavy Node.js WASI simulators and pre-warming the Zig WASI toolchain:
- **Peak RAM:** Only **~41 MB** (96% memory reduction from initial 1GB peaks).
- **Execution Speed:** Returns compiled Base64 WASM binaries in **~0.4s**.
- **Cold-Start Resilience:** `studio.js` gracefully intercepts HTTP 502/503/504 gateway statuses when the container spins up from scale-to-zero, notifying the user without throwing JSON parse exceptions.

---

## 5. Local Development

Run the zero-dependency local development server:

```bash
node dev_server.js
```

Open [http://localhost:8080](http://localhost:8080) in any modern browser.
To compile live user code locally, ensure the project root has `nizam` in PATH or in `stage3/`.
