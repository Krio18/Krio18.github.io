import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "/" parce que le dépôt s'appelle Krio18.github.io (site racine).
// Si un jour tu déploies depuis un dépôt nommé autrement (ex: "portfolio"),
// remplace par base: "/portfolio/".
export default defineConfig({
  plugins: [react()],
  base: "/",
});
