import react from "@vitejs/plugin-react"
import path from "node:path"
import {fileURLToPath} from "node:url"
import {defineConfig} from "vite"

const dir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.join(dir, "playground"),
  cacheDir: path.join(dir, "node_modules/.vite-site"),
  plugins: [react()],
  build: {
    outDir: path.join(dir, "site"),
    emptyOutDir: true,
  },
})
