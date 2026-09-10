// ── Browser WASI Preview 1 Implementation ────────────────────────────
// Provides a zero-dependency, in-browser runtime environment for WASI binaries.

class WASIExitError extends Error {
  constructor(exitCode) {
    super(`WASI proc_exit with code ${exitCode}`);
    this.name = "WASIExitError";
    this.exitCode = exitCode;
  }
}

class BrowserWASI {
  constructor(options = {}) {
    this.args = options.args || ["nizam.wasm"];
    this.env = options.env || {};
    this.stdout = options.stdout || ((text) => console.log(text));
    this.stderr = options.stderr || ((text) => console.error(text));
    this.stdin = options.stdin || (() => "");
    this.instance = null;
    this.memory = null;
    this.decoder = new TextDecoder("utf-8");
    this.encoder = new TextEncoder();
  }

  init(instance) {
    this.instance = instance;
    this.memory = instance.exports.memory;
  }

  getMemoryView() {
    if (!this.memory) {
      if (this.instance && this.instance.exports.memory) {
        this.memory = this.instance.exports.memory;
      } else {
        throw new Error("WASM Memory not initialized");
      }
    }
    return new DataView(this.memory.buffer);
  }

  getUint8Array() {
    if (!this.memory) {
      if (this.instance && this.instance.exports.memory) {
        this.memory = this.instance.exports.memory;
      } else {
        throw new Error("WASM Memory not initialized");
      }
    }
    return new Uint8Array(this.memory.buffer);
  }

  getImports() {
    return {
      wasi_snapshot_preview1: {
        args_sizes_get: (argc_ptr, argv_buf_size_ptr) => {
          const view = this.getMemoryView();
          view.setUint32(argc_ptr, this.args.length, true);
          let totalBytes = 0;
          for (const arg of this.args) {
            totalBytes += this.encoder.encode(arg).length + 1;
          }
          view.setUint32(argv_buf_size_ptr, totalBytes, true);
          return 0; // ESUCCESS
        },

        args_get: (argv_ptr, argv_buf_ptr) => {
          const view = this.getMemoryView();
          const u8 = this.getUint8Array();
          let currentBufPtr = argv_buf_ptr;

          for (let i = 0; i < this.args.length; i++) {
            view.setUint32(argv_ptr + i * 4, currentBufPtr, true);
            const encoded = this.encoder.encode(this.args[i]);
            u8.set(encoded, currentBufPtr);
            u8[currentBufPtr + encoded.length] = 0;
            currentBufPtr += encoded.length + 1;
          }
          return 0;
        },

        environ_sizes_get: (environc_ptr, environ_buf_size_ptr) => {
          const view = this.getMemoryView();
          const keys = Object.keys(this.env);
          view.setUint32(environc_ptr, keys.length, true);
          let totalBytes = 0;
          for (const k of keys) {
            totalBytes += this.encoder.encode(`${k}=${this.env[k]}`).length + 1;
          }
          view.setUint32(environ_buf_size_ptr, totalBytes, true);
          return 0;
        },

        environ_get: (environ_ptr, environ_buf_ptr) => {
          const view = this.getMemoryView();
          const u8 = this.getUint8Array();
          const keys = Object.keys(this.env);
          let currentBufPtr = environ_buf_ptr;

          for (let i = 0; i < keys.length; i++) {
            view.setUint32(environ_ptr + i * 4, currentBufPtr, true);
            const encoded = this.encoder.encode(`${keys[i]}=${this.env[keys[i]]}`);
            u8.set(encoded, currentBufPtr);
            u8[currentBufPtr + encoded.length] = 0;
            currentBufPtr += encoded.length + 1;
          }
          return 0;
        },

        fd_write: (fd, iovs_ptr, iovs_len, nwritten_ptr) => {
          const view = this.getMemoryView();
          const u8 = this.getUint8Array();
          let totalWritten = 0;
          let outputText = "";

          for (let i = 0; i < iovs_len; i++) {
            const buf_ptr = view.getUint32(iovs_ptr + i * 8, true);
            const buf_len = view.getUint32(iovs_ptr + i * 8 + 4, true);
            const chunk = u8.subarray(buf_ptr, buf_ptr + buf_len);
            outputText += this.decoder.decode(chunk, { stream: true });
            totalWritten += buf_len;
          }

          view.setUint32(nwritten_ptr, totalWritten, true);

          if (fd === 1) {
            this.stdout(outputText);
          } else if (fd === 2) {
            this.stderr(outputText);
          }
          return 0;
        },

        fd_read: (fd, iovs_ptr, iovs_len, nread_ptr) => {
          const view = this.getMemoryView();
          view.setUint32(nread_ptr, 0, true);
          return 0;
        },

        fd_close: (fd) => {
          return 0;
        },

        fd_seek: (fd, offset_low, offset_high, whence, newoffset_ptr) => {
          const view = this.getMemoryView();
          view.setBigUint64(newoffset_ptr, 0n, true);
          return 0;
        },

        fd_fdstat_get: (fd, stat_ptr) => {
          const view = this.getMemoryView();
          view.setUint8(stat_ptr, 2); // fs_filetype = character_device
          view.setUint16(stat_ptr + 2, 0, true); // fs_flags = 0
          view.setBigUint64(stat_ptr + 8, 0x1fffffffn, true); // fs_rights_base
          view.setBigUint64(stat_ptr + 16, 0x1fffffffn, true); // fs_rights_inheriting
          return 0;
        },

        fd_prestat_get: (fd, prestat_ptr) => {
          return 8; // EBADF
        },

        fd_prestat_dir_name: (fd, path_ptr, path_len) => {
          return 8; // EBADF
        },

        clock_time_get: (clock_id, precision, time_ptr) => {
          const view = this.getMemoryView();
          const nowNs = BigInt(Math.floor(performance.now() * 1e6));
          view.setBigUint64(time_ptr, nowNs, true);
          return 0;
        },

        random_get: (buf_ptr, buf_len) => {
          const u8 = this.getUint8Array();
          if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            crypto.getRandomValues(u8.subarray(buf_ptr, buf_ptr + buf_len));
          } else {
            for (let i = 0; i < buf_len; i++) {
              u8[buf_ptr + i] = Math.floor(Math.random() * 256);
            }
          }
          return 0;
        },

        proc_exit: (code) => {
          throw new WASIExitError(code);
        }
      }
    };
  }

  async start(instance) {
    this.init(instance);
    try {
      if (instance.exports._start) {
        instance.exports._start();
      } else if (instance.exports.main) {
        return instance.exports.main();
      }
      return 0;
    } catch (err) {
      if (err instanceof WASIExitError) {
        return err.exitCode;
      }
      throw err;
    }
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BrowserWASI, WASIExitError };
}
