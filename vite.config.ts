import react from "@vitejs/plugin-react"
import path from "node:path"
import {fileURLToPath} from "node:url"
import {defineConfig} from "vite"

const dir = path.dirname(fileURLToPath(import.meta.url))

function linkStyles() {
  return {
    name: "link-styles",
    apply: "build",
    generateBundle(_options, bundle) {
      const entry = bundle["index.js"]
      if (entry?.type === "chunk" && !entry.code.includes('import "./pixel-avatar.css"')) {
        entry.code = `import "./pixel-avatar.css";\n${entry.code}`
      }
    },
  }
}

export default defineConfig(({command}) => ({
  root: command === "serve" ? path.join(dir, "playground") : dir,
  plugins: [react(), linkStyles()],
  server: {port: 5174, strictPort: true},
  build: {
    lib: {
      entry: path.join(dir, "src/index.ts"),
      formats: ["es"],
      fileName: "index",
      cssFileName: "pixel-avatar",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
    emptyOutDir: true,
  },
}))
