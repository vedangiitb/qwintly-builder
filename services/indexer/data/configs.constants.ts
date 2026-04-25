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
    "app/{route}/":
      "Each route defines UI via page.config.ts and renders via page.tsx (no JSX UI in page.tsx).",
    "components/": "UI sections + shared components",
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
      "app/layout.tsx",
      "app/page.tsx",
      "app/page.config.ts",
      "app/not-found.tsx",
      "app/globals.css",
    ],
    requiredPerRoute: ["app/{route}/page.tsx", "app/{route}/page.config.ts"],
    optionalPerRoute: [
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
  uiArchitecture: {
    pattern: "config-driven UI",

    rule: [
      "UI MUST be defined in page.config.ts using BuilderElement[]",
      "page.tsx MUST only render config via the shared renderer (no hardcoded JSX UI)",
      "Use only supported ElementType values; do not invent new types",
    ],

    configStructure: {
      root: "export const config = { elements: BuilderElement[] }",

      elementTypes: {
        fragment: "{ id, type: 'fragment', children: BuilderElement[] }",
        div: "{ id, type: 'div', className?, children?: BuilderElement[] }",
        text: "{ id, type: 'text', props: { text: string } }",
        image: "{ id, type: 'image', props: { src: string, alt? } }",
        button:
          "{ id, type: 'button', props?: { text? }, children?: BuilderElement[] }",
        input:
          "{ id, type: 'input', props?: { placeholder?, value?, type? }, className? }",
        textarea:
          "{ id, type: 'textarea', props?: { placeholder?, value? }, className? }",
        link: "{ id, type: 'link', props?: { href?, text?, target?, rel? }, children?: BuilderElement[] }",
        icon: "{ id, type: 'icon', props?: { name?, size?, color?, strokeWidth? }, meta?: { name? }, className? }",
      },

      rules: [
        "Elements MUST follow the BuilderElement schema (id, type, optional props/children/className/meta/visible).",
        "The top-level element SHOULD be { id: 'root', type: 'div', children: [...] }.",
        "Text content MUST be in props.text (not a top-level 'text' field).",
        "Use className for Tailwind-only styling (no inline styles).",
        "IDs must be unique per page.",
      ],
    },
  },
} as const satisfies ProjectConventionsConfig;
