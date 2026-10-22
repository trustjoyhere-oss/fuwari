import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { defineConfig } from "vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: resolve(projectRoot, "cms"),
	base: "/admin/",
	publicDir: "public",
	build: {
		outDir: resolve(projectRoot, "public/admin"),
		emptyOutDir: true,
		sourcemap: false,
		target: "es2022",
	},
});
