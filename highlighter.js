// ── Nizam & Mantiq High-Performance Syntax Highlighter ─────────────────

(function (global) {
  "use strict";

  // ── HTML Entity Escaping ─────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ── Keywords & Tokens Dictionary ─────────────────────────────────────
  const NIZAM_KEYWORDS = new Set([
    "fn", "let", "var", "const", "struct", "enum", "if", "else",
    "while", "for", "in", "return", "break", "continue", "import",
    "from", "as", "to", "ref", "deref", "and", "or", "not", "xor",
    "shl", "shr", "extern", "async", "spawn", "await", "channel",
    "pub", "public", "private"
  ]);

  const MANTIQ_EXTRA_KEYWORDS = new Set([
    "class", "interface", "extends", "implements", "super", "self",
    "match", "case", "with", "yield", "pass", "lambda", "def"
  ]);

  const STANDARD_TYPES = new Set([
    "i8", "i16", "i32", "i64", "u8", "u16", "u32", "u64",
    "f32", "f64", "bool", "cstr", "ptr", "usize", "isize", "void",
    "String", "List", "Dict", "Set", "Option", "Result", "Channel", "Task"
  ]);

  const LITERALS = new Set([
    "True", "False", "true", "false", "None", "null"
  ]);

  const BUILTIN_FUNCS = new Set([
    "print", "printf", "puts", "malloc", "free", "exit",
    "sizeof", "alignof", "assert", "assert_true", "strcmp"
  ]);

  const LLVM_INSTRUCTIONS = new Set([
    "define", "declare", "ret", "call", "br", "getelementptr", "alloca",
    "load", "store", "icmp", "fcmp", "add", "sub", "mul", "sdiv", "udiv",
    "fadd", "fsub", "fmul", "fdiv", "and", "or", "xor", "shl", "lshr", "ashr",
    "phi", "select", "switch", "zext", "sext", "trunc", "bitcast",
    "ptrtoint", "inttoptr", "unreachable", "extractvalue", "insertvalue"
  ]);

  const LLVM_TYPES = new Set([
    "i1", "i8", "i16", "i32", "i64", "float", "double", "ptr", "void",
    "label", "metadata", "type", "opaque"
  ]);

  const LLVM_ATTRS = new Set([
    "private", "unnamed_addr", "constant", "align", "target", "datalayout",
    "triple", "zeroinitializer", "null", "exact", "inbounds", "global",
    "internal", "external", "nounwind", "readnone", "readonly", "musttail"
  ]);

  // ── Highlighting Nizam / Mantiq ───────────────────────────────────────
  function highlightSource(code, isMantiq = false) {
    if (!code) return "";

    // Sequential regex token matching
    // Order matters: comments -> f-strings -> strings -> numbers -> identifiers -> operators -> punctuation
    const tokenRegex = new RegExp(
      [
        // 1. Comments: //... or #...
        "(\\/\\/[^\\n]*|#[^\\n]*)",
        // 2. F-strings: f"..."
        "(f\"(?:[^\"\\\\]|\\\\.)*\")",
        // 3. Regular strings: "..." or `...` or '...'
        "(\"(?:[^\"\\\\]|\\\\.)*\"|`[^`]*`|'(?:[^'\\\\]|\\\\.)*')",
        // 4. Numbers: hex, bin, float, int
        "\\b(0x[0-9a-fA-F_]+|0b[01_]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b",
        // 5. Identifiers (keywords, types, calls, variables)
        "([a-zA-Z_][a-zA-Z0-9_]*)",
        // 6. Operators
        "(=>|->|==|!=|<=|>=|\\+=|-=|\\*=|\\/=|&&|\\|\\||!|\\+|-|\\*|\\/|%|=|<|>)",
        // 7. Punctuation
        "([;:.,()\\[\\]{}])"
      ].join("|"),
      "g"
    );

    let html = "";
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(code)) !== null) {
      // Append un-tokenized whitespace/gaps
      if (match.index > lastIndex) {
        html += escapeHtml(code.substring(lastIndex, match.index));
      }

      const text = match[0];

      // Comment
      if (text.startsWith("//") || text.startsWith("#")) {
        html += `<span class="tok-comment">${escapeHtml(text)}</span>`;
      }
      // F-String with interpolation parsing
      else if (text.startsWith("f\"")) {
        html += `<span class="tok-string">`;
        // Split by interpolation expression {expr}
        const parts = text.split(/(\{[^}]+\})/);
        for (const p of parts) {
          if (p.startsWith("{") && p.endsWith("}")) {
            const innerCode = p.slice(1, -1);
            html += `<span class="tok-interp-brace">{</span><span class="tok-interp-val">${highlightSource(innerCode, isMantiq)}</span><span class="tok-interp-brace">}</span>`;
          } else {
            html += escapeHtml(p);
          }
        }
        html += `</span>`;
      }
      // Regular String or Template
      else if (text.startsWith("\"") || text.startsWith("`") || text.startsWith("'")) {
        html += `<span class="tok-string">${escapeHtml(text)}</span>`;
      }
      // Number
      else if (/^0x|^0b|^\d/.test(text)) {
        html += `<span class="tok-number">${escapeHtml(text)}</span>`;
      }
      // Identifier / Keyword
      else if (/^[a-zA-Z_]/.test(text)) {
        if (NIZAM_KEYWORDS.has(text) || (isMantiq && MANTIQ_EXTRA_KEYWORDS.has(text))) {
          if (text === "return" || text === "break" || text === "continue" || text === "yield") {
            html += `<span class="tok-control">${escapeHtml(text)}</span>`;
          } else if (text === "async" || text === "spawn" || text === "await" || text === "channel") {
            html += `<span class="tok-concurrency">${escapeHtml(text)}</span>`;
          } else if (text === "self" || text === "super") {
            html += `<span class="tok-self">${escapeHtml(text)}</span>`;
          } else {
            html += `<span class="tok-keyword">${escapeHtml(text)}</span>`;
          }
        } else if (STANDARD_TYPES.has(text) || /^[A-Z][a-zA-Z0-9_]*$/.test(text)) {
          html += `<span class="tok-type">${escapeHtml(text)}</span>`;
        } else if (LITERALS.has(text)) {
          html += `<span class="tok-literal">${escapeHtml(text)}</span>`;
        } else if (BUILTIN_FUNCS.has(text)) {
          html += `<span class="tok-builtin">${escapeHtml(text)}</span>`;
        } else {
          // Check if followed by opening parenthesis (function call)
          const rest = code.substring(tokenRegex.lastIndex);
          if (/^\s*\(/.test(rest)) {
            html += `<span class="tok-fn-call">${escapeHtml(text)}</span>`;
          } else {
            html += `<span class="tok-ident">${escapeHtml(text)}</span>`;
          }
        }
      }
      // Operator
      else if (/^[=\-><!+*\/%&|]/.test(text)) {
        html += `<span class="tok-operator">${escapeHtml(text)}</span>`;
      }
      // Punctuation
      else {
        html += `<span class="tok-punct">${escapeHtml(text)}</span>`;
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < code.length) {
      html += escapeHtml(code.substring(lastIndex));
    }

    return html;
  }

  // ── Highlighting LLVM IR ──────────────────────────────────────────────
  function highlightLLVM(ir) {
    if (!ir) return "";

    const irRegex = new RegExp(
      [
        // 1. Comments: ; ...
        "(;[^\\n]*)",
        // 2. String literals: c"..." or "..."
        "(c?\"(?:[^\"\\\\]|\\\\.)*\")",
        // 3. Registers: %...
        "(%[a-zA-Z0-9_.]+)",
        // 4. Globals: @...
        "(@[a-zA-Z0-9_.]+)",
        // 5. Metadata: !...
        "(![a-zA-Z0-9_.]+)",
        // 6. Labels: name:
        "(^[a-zA-Z0-9_.]+:(?=\\s*(?:;|$)))",
        // 7. Numbers
        "\\b(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b",
        // 8. Keywords & Identifiers
        "([a-zA-Z_][a-zA-Z0-9_]*)",
        // 9. Punctuation & Operators
        "([=,()*{}\\[\\]])"
      ].join("|"),
      "gm"
    );

    let html = "";
    let lastIndex = 0;
    let match;

    while ((match = irRegex.exec(ir)) !== null) {
      if (match.index > lastIndex) {
        html += escapeHtml(ir.substring(lastIndex, match.index));
      }

      const text = match[0];

      if (text.startsWith(";")) {
        html += `<span class="tok-comment">${escapeHtml(text)}</span>`;
      } else if (text.startsWith("\"") || text.startsWith("c\"")) {
        html += `<span class="tok-string">${escapeHtml(text)}</span>`;
      } else if (text.startsWith("%")) {
        html += `<span class="tok-register">${escapeHtml(text)}</span>`;
      } else if (text.startsWith("@")) {
        html += `<span class="tok-global">${escapeHtml(text)}</span>`;
      } else if (text.startsWith("!")) {
        html += `<span class="tok-meta">${escapeHtml(text)}</span>`;
      } else if (text.endsWith(":")) {
        html += `<span class="tok-label">${escapeHtml(text)}</span>`;
      } else if (/^-?\d/.test(text)) {
        html += `<span class="tok-number">${escapeHtml(text)}</span>`;
      } else if (/^[a-zA-Z_]/.test(text)) {
        if (LLVM_INSTRUCTIONS.has(text)) {
          html += `<span class="tok-llvm-inst">${escapeHtml(text)}</span>`;
        } else if (LLVM_TYPES.has(text)) {
          html += `<span class="tok-type">${escapeHtml(text)}</span>`;
        } else if (LLVM_ATTRS.has(text)) {
          html += `<span class="tok-llvm-attr">${escapeHtml(text)}</span>`;
        } else {
          html += `<span class="tok-ident">${escapeHtml(text)}</span>`;
        }
      } else {
        html += `<span class="tok-punct">${escapeHtml(text)}</span>`;
      }

      lastIndex = irRegex.lastIndex;
    }

    if (lastIndex < ir.length) {
      html += escapeHtml(ir.substring(lastIndex));
    }

    return html;
  }

  // ── Public Export ────────────────────────────────────────────────────
  global.Highlighter = {
    escapeHtml,
    highlightNizam: (code) => highlightSource(code, false),
    highlightMantiq: (code) => highlightSource(code, true),
    highlightLLVM: (ir) => highlightLLVM(ir),
    highlightCode: (code, lang = "nizam") => {
      if (lang === "llvm" || lang === "ir") return highlightLLVM(code);
      if (lang === "mantiq" || lang === "mq") return highlightSource(code, true);
      return highlightSource(code, false);
    }
  };

})(typeof window !== "undefined" ? window : global);
