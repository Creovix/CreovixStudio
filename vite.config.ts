import path from "node:path";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

function nitroDeployPreset(): "netlify" | "vercel" | "node-server" {
  if (process.env["NETLIFY"]) return "netlify";
  if (process.env["VERCEL"]) return "vercel";
  return "node-server";
}

export default defineConfig({
  base: "/",
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      "@": path.join(rootDir, "src"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      srcDirectory: "src",
      server: {
        // Resolved from srcDirectory → src/server.ts
        entry: "server",
        build: {
          // Embed route CSS in the SSR HTML so a hashed /assets/*.css 404 cannot
          // leave production unstyled (common with styles.css?url + Nitro/Vercel).
          inlineCss: true,
        },
      },
    }),
    nitro({
      // Vercel → `.vercel/output` (Build Output API). Netlify → `dist` + functions-internal.
      // Local `npm start` → `.output/public` + `.output/server`. Never set Vercel/Netlify
      // publish/output to `.output/public` — that is static-only and every SSR route 404s.
      preset: nitroDeployPreset(),
    }),
    viteReact(),
    tailwindcss(),
  ],
});
