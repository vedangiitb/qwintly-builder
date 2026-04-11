import type { ProjectConfigsConfig } from "../../../types/index/configs.types.js";
import type { ProjectConventionsConfig } from "../../../types/index/conventions.types.js";
import type { IndexingConfig } from "../../../types/index/indexing.types.js";

export const projectConfigs = {
  frameworkConfig: {
    name: "Next.js",
    router: "App Router",
    language: "TypeScript",
    styling: "Tailwind CSS",
    ui: "shadcn/ui",
    stateManagement: "React Context + local state",
  },
  runtimeConfig: {
    target: "frontend-only",
    rendering:
      "server-components-by-default (use 'use client' only when needed)",
    serverActions: "disabled",
    apiRoutes: "disabled",
    dataFetching: "client-side (fetch or mocked)",
  },
  toolingConfig: {
    packageManager: "npm",
    linting: "eslint",
    formatting: "prettier",
    typecheck: "tsc --noEmit",
    testing: "none",
  },
} as const satisfies ProjectConfigsConfig;

export const indexing = {
  includeExtensions: [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".mdx",
    ".css",
    ".scss",
    ".sass",
  ],
  excludeDirectories: [
    "node_modules",
    ".next",
    "dist",
    "build",
    "out",
    "coverage",
    ".git",
  ],
  maxFileBytes: 200_000,
  chunkSize: 900,
  chunkOverlap: 150,
} as const satisfies IndexingConfig;

export const projectConventions = {
  shadcn: {
    installed: [
      "avatar",
      "badge",
      "button",
      "card",
      "dialog",
      "dropdown-menu",
      "input",
      "sheet",
      "table",
      "tabs",
      "tooltip",
    ],
    location: "components/ui/{component}.tsx",
    notes: "TooltipProvider is wired in app/layout.tsx",
  },
  folderConventions: {
    "app/": "routes, layouts, metadata, globals.css",
    "components/": "UI sections + shared components",
    "components/marketing/": "marketing site sections (header/footer/etc.)",
    "components/marketing/sections/": "home page sections (small, composable)",
    "components/ui/": "shadcn/ui primitives",
    "lib/": "shared config + utilities (cn, site config, etc.)",
    "public/": "static assets",
    "hooks/": "optional (add when you introduce reusable client hooks)",
    "services/": "optional (client-side wrappers for fetch / browser APIs)",
    "utils/": "optional (pure helpers if they outgrow lib/utils.ts)",
  },
  importsConventions: {
    alias: "@/* -> repo root (tsconfig paths)",
    order: ["next/react", "third-party", "@/*", "relative", "styles"],
  },
  routingConventions: {
    required: [
      "app/page.tsx",
      "app/layout.tsx",
      "app/not-found.tsx",
      "app/globals.css",
    ],
    optionalPerRoute: [
      "app/{route}/page.tsx",
      "app/{route}/layout.tsx",
      "app/{route}/loading.tsx",
      "app/{route}/error.tsx",
    ],
    routeGroups: "app/(group)/... (optional)",
    dynamicSegments: "app/{route}/[param] (optional)",
  },
  namingConventions: {
    components: "PascalCase",
    folders: "kebab-case",
    hooks: "useCamelCase",
  },
  componentConventions: {
    type: "function components",
    exports: "named exports (prefer)",
    propsTyping: "TypeScript types/interfaces when non-trivial",
  },
  stylingConventions: {
    default: "Tailwind-first",
    globals: "app/globals.css",
    helper: "lib/utils.ts: cn(...)",
  },
} as const satisfies ProjectConventionsConfig;
