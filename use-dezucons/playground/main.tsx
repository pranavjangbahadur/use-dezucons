import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import {Playground} from "./Playground.tsx"
import "./playground.css"

const root = document.getElementById("root")
if (root) createRoot(root).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
)
