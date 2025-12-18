import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { execSync } from "child_process";

function getMkcertCaroot() {
  try {
    return execSync("mkcert -CAROOT", { encoding: "utf8" }).trim();
  } catch {
    // fallback: common default on Linux
    return path.join(process.env.HOME || "", ".local/share/mkcert");
  }
}

export default defineConfig(({ mode }) => {
  const caroot = getMkcertCaroot();
  const keyPath = path.join(caroot, "localhost-key.pem");
  const certPath = path.join(caroot, "localhost.pem");

  return {
    server: {
      host: "localhost",
      port: 5173,
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
