// frontend/src/polyfills.js
import { Buffer } from "buffer";

// Make `global` point to `window` in the browser
if (typeof global === "undefined" && typeof window !== "undefined") {
  // @ts-ignore
  window.global = window;
}

// Polyfill Buffer for libs that expect it
if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}

// Very minimal process shim so some libs don't explode
if (typeof window !== "undefined" && !window.process) {
  window.process = {
    env: {},
  };
}
