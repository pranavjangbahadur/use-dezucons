import {readdirSync, readFileSync, writeFileSync} from "node:fs"
import path from "node:path"

const dist = path.join(import.meta.dirname, "..", "dist")
for (const file of readdirSync(dist)) {
  if (!file.endsWith(".d.ts")) continue
  const full = path.join(dist, file)
  const next = readFileSync(full, "utf8").replace(/\.(tsx|ts)(?=["'])/g, ".js")
  writeFileSync(full, next)
}
