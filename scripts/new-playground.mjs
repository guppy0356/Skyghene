import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const name = process.argv[2];
if (!name) {
  console.error("Usage: pnpm new:playground <name>");
  process.exit(1);
}

const pascal = name.charAt(0).toUpperCase() + name.slice(1);
const root = join("playgrounds", name);
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error("Playground name must be kebab-case: lowercase letters, digits and hyphens.");
  process.exit(1);
}
if (existsSync(root)) {
  console.error(`playgrounds/${name} already exists — pick another name.`);
  process.exit(1);
}

// Directory structure
const dirs = [
  root,
  join(root, "src"),
  join(root, "src", "lib"),
  join(root, "src", "features"),
  join(root, "src", "features", "welcome"),
  join(root, "src", "mocks"),
  join(root, "public"),
  join(root, ".storybook"),
];

for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
}

// --- File templates ---

const packageJson = `{
  "name": "@skyghene/${name}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit -p .",
    "test": "vitest run",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "generate": "pnpm generate:api",
    "generate:api": "typed-openapi src/openapi.yaml --runtime zod --output src/lib/api.gen.ts"
  },
  "dependencies": {
    "@tanstack/react-query": "catalog:",
    "@tanstack/react-router": "catalog:",
    "ky": "catalog:",
    "react": "catalog:",
    "react-dom": "catalog:",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@storybook/addon-vitest": "catalog:",
    "@storybook/react-vite": "catalog:",
    "@tailwindcss/vite": "catalog:",
    "@skyghene/tailwind": "workspace:*",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vitejs/plugin-react": "catalog:",
    "@vitest/browser": "catalog:",
    "@vitest/browser-playwright": "catalog:",
    "msw": "catalog:",
    "playwright": "catalog:",
    "storybook": "catalog:",
    "tailwindcss": "catalog:",
    "typed-openapi": "catalog:",
    "typescript": "catalog:",
    "vite": "catalog:",
    "vite-plugin-checker": "catalog:",
    "vitest": "catalog:"
  }
}
`;

const tsconfig = `{
  "extends": "../../tsconfig.json",
  "include": ["src"]
}
`;

const viteConfig = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [react(), tailwindcss(), checker({ typescript: true })],
});
`;

const vitestConfig = `import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
            storybookScript: "pnpm storybook --no-open",
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            // pnpm resolves two vitest instances via peer graphs, splitting the
            // BrowserProviderOption type. Cast bridges them; runtime is unaffected.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            provider: playwright({}) as any,
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
`;

const storybookMain = `import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-vitest"],
};

export default config;
`;

const storybookPreview = `import type { Preview } from "@storybook/react-vite";
import "../src/app.css";

const preview: Preview = {};

export default preview;
`;

const welcomeStory = `import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Welcome",
  render: () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to ${pascal}</h1>
      <p className="text-gray-600">
        Replace this with your first feature story.
      </p>
    </div>
  ),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`;

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pascal}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const rootRouteTsx = `import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <main>
      <Outlet />
    </main>
  ),
});

// Placeholder until the first feature page registers its own route.
export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <div>
      <h1>${pascal} Playground</h1>
    </div>
  ),
});
`;

const routerTs = `import { createRouter } from "@tanstack/react-router";
import { rootRoute, indexRoute } from "./root.route";

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
`;

const mainTsx = `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import "./app.css";

const queryClient = new QueryClient();

async function enableMocking() {
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  );
});
`;

const appCss = `@import "@skyghene/tailwind/base.css";
`;

const viteEnvDts = `/// <reference types="vite/client" />
`;

// Placeholder until the first feature defines its endpoints and schemas.
// It exists so generate:api can run at scaffold time and src/lib/api-client.ts resolves
// ./api.gen from the first commit on.
const openapiYaml = `openapi: 3.1.0
info:
  title: ${pascal}
  version: 0.0.0
paths: {}
`;

// layers/api/api-client.md
const apiClient = `import ky, { HTTPError } from "ky";
import { createApiClient, type Fetcher } from "./api.gen";

// ky's status-code retry only runs while it throws, so HTTPError is caught
// *after* the retries and handed back as a response. \`error.response\` cannot
// be handed back as-is: ky consumed its body to populate \`error.data\`, so the
// error body is re-serialized into a fresh Response.
const fetcher: Fetcher = {
  fetch: async ({ url, method, urlSearchParams, parameters, requestFormat, overrides }) => {
    try {
      return await ky(url, {
        method,
        searchParams: urlSearchParams,
        ...(requestFormat === "json" && parameters?.body !== undefined
          ? { json: parameters.body }
          : {}),
        ...overrides,
      });
    } catch (error) {
      if (error instanceof HTTPError) {
        const { response } = error;
        const body =
          error.data === undefined
            ? null
            : typeof error.data === "string"
              ? error.data
              : JSON.stringify(error.data);
        return new Response(body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      }
      throw error;
    }
  },
};

// The client resolves paths against an absolute base URL. Input validation
// stays off: request shapes are TS-owned end to end, and zod input parsing
// would rewrite them (a defaulted contract param gets injected into the
// query string).
export const api = createApiClient(fetcher, window.location.origin, {
  validate: "output",
});

export { TypedStatusError } from "./api.gen";
`;

const mockHandlers = `import type { HttpHandler } from "msw";

// Empty until src/openapi.yaml has its first endpoint.
export const handlers: HttpHandler[] = [];
`;

const mockBrowser = `import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
`;

// --- Write files ---

const files = [
  [join(root, "package.json"), packageJson],
  [join(root, "tsconfig.json"), tsconfig],
  [join(root, "vite.config.ts"), viteConfig],
  [join(root, "vitest.config.ts"), vitestConfig],
  [join(root, "index.html"), indexHtml],
  [join(root, "src", "main.tsx"), mainTsx],
  [join(root, "src", "root.route.tsx"), rootRouteTsx],
  [join(root, "src", "router.ts"), routerTs],
  [join(root, "src", "app.css"), appCss],
  [join(root, "src", "vite-env.d.ts"), viteEnvDts],
  [join(root, "src", "openapi.yaml"), openapiYaml],
  [join(root, "src", "lib", "api-client.ts"), apiClient],
  [join(root, "src", "mocks", "handlers.ts"), mockHandlers],
  [join(root, "src", "mocks", "browser.ts"), mockBrowser],
  [join(root, ".storybook", "main.ts"), storybookMain],
  [join(root, ".storybook", "preview.ts"), storybookPreview],
  [join(root, "src", "features", "welcome", "Welcome.stories.tsx"), welcomeStory],
];

for (const [filePath, content] of files) {
  writeFileSync(filePath, content);
}

console.log(`\nScaffolded playground: ${root}`);

// Register the public directory so the root postinstall writes the MSW worker script into
// it during the install below — a playground missing from this list never gets one, and
// never gets it updated.
const rootManifest = JSON.parse(readFileSync("package.json", "utf8"));
rootManifest.msw.workerDirectory = [
  ...new Set([...rootManifest.msw.workerDirectory, join(root, "public")]),
].sort();
writeFileSync("package.json", `${JSON.stringify(rootManifest, null, 2)}\n`);

// Install dependencies — the root postinstall syncs the MSW worker script
console.log("\nInstalling dependencies...");
execSync("pnpm install", { stdio: "inherit" });

// Generate the contract module — src/lib/api.gen.ts and its sidecar — from the
// placeholder contract, so api-client.ts typechecks before the first feature lands.
console.log("\nGenerating the contract module...");
execSync(`pnpm --filter @skyghene/${name} generate:api`, { stdio: "inherit" });

console.log(`\n✅ Playground "${name}" is ready!`);
console.log(`   cd ${root}`);
console.log(`   pnpm --filter @skyghene/${name} dev`);
