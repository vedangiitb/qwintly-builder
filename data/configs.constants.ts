export const projectConfigs = {
  frameworkConfig: {
    name: "Next.js",
    router: "App Router",
    language: "TypeScript",
    styling: "Tailwind CSS",
    uiLibrary: "shadcn/ui",
    stateManagement: "React Context + local state",
  },
  runtimeConfig: {
    target: "frontend-only",
    rendering: "client-components",
    serverActions: "disabled",
    apiRoutes: "disabled",
    dataFetching: "client-side (fetch/axios or mocked)",
  },
  toolingConfig: {
    packageManager: "npm",
    linting: "eslint",
    formatting: "prettier",
    testing: "none",
  },
  indexing: {
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
  },
  folderStructure: {
    folders: [
      {
        name: "app",
        role: "routing_and_page_composition",
        description:
          "Defines routes, layouts, templates, loading, and error boundaries",
        allowed_operations: [
          "add_route",
          "modify_page",
          "modify_layout",
          "add_route_group",
        ],
        typical_files: [
          "app/{route}/page.tsx",
          "app/{route}/layout.tsx",
          "app/{route}/loading.tsx",
          "app/{route}/error.tsx",
        ],
      },
      {
        name: "app/(group)",
        role: "route_grouping",
        description:
          "Groups routes without affecting URL path using parentheses",
        allowed_operations: ["add_route_group"],
        typical_files: ["app/(marketing)/page.tsx"],
      },
      {
        name: "components",
        role: "ui_components",
        description: "Reusable UI components and page sections",
        allowed_operations: [
          "add_component",
          "modify_component",
          "add_subfolder",
        ],
      },
      {
        name: "components/ui",
        role: "design_system",
        description: "shadcn/ui base components and primitives",
        allowed_operations: ["add_component", "modify_component"],
      },
      {
        name: "hooks",
        role: "stateful_logic",
        description:
          "Custom React hooks encapsulating reusable stateful behavior",
        allowed_operations: ["add_hook", "modify_hook"],
      },
      {
        name: "providers",
        role: "app_context",
        description: "Global providers for theme, state, or data layers",
        allowed_operations: ["add_provider", "modify_provider"],
      },
      {
        name: "styles",
        role: "styling",
        description: "Global styles, CSS modules, and design tokens",
        allowed_operations: ["add_style", "modify_style"],
      },
      {
        name: "services",
        role: "client_services",
        description:
          "Client-side services for data fetching or browser APIs",
        allowed_operations: ["add_service", "modify_service"],
      },
      {
        name: "lib",
        role: "core_logic",
        description: "Core application logic and shared non-UI utilities",
        allowed_operations: ["add_module", "modify_module"],
      },
      {
        name: "utils",
        role: "pure_utilities",
        description: "Stateless helper functions and constants",
        allowed_operations: ["add_utility", "modify_utility"],
      },
      {
        name: "data",
        role: "local_data",
        description: "Static data files, mock content, and fixtures",
        allowed_operations: ["add_data", "modify_data"],
      },
      {
        name: "types",
        role: "shared_types",
        description: "Shared TypeScript types and interfaces",
        allowed_operations: ["add_type", "modify_type"],
      },
      {
        name: "store",
        role: "state_store",
        description: "State management setup (context, reducers, stores)",
        allowed_operations: ["add_store", "modify_store"],
      },
      {
        name: "config",
        role: "configuration",
        description: "Project configuration and environment setup",
        allowed_operations: ["modify_config"],
        restrictions: ["avoid_creating_new_configs_without_request"],
      },
      {
        name: "public",
        role: "static_assets",
        description: "Public static assets served from the root",
        allowed_operations: ["add_asset", "modify_asset"],
      },
      {
        name: "assets",
        role: "bundled_assets",
        description: "Bundled assets imported by components",
        allowed_operations: ["add_asset", "modify_asset"],
      },
    ],
  },

  routingConventions: {
    pagePattern: "app/{route}/page.tsx",
    layoutPattern: "app/{route}/layout.tsx",
    defaultPage: "app/page.tsx",
    templatePattern: "app/{route}/template.tsx",
    loadingPattern: "app/{route}/loading.tsx",
    errorPattern: "app/{route}/error.tsx",
    notFoundPattern: "app/{route}/not-found.tsx",
    routeGroupPattern: "app/(group)/{route}",
    dynamicSegmentPattern: "app/{route}/[param]",
    catchAllSegmentPattern: "app/{route}/[...param]",
    optionalCatchAllSegmentPattern: "app/{route}/[[...param]]",
    apiRoutesAllowed: false,
  },

  namingConventions: {
    components: "PascalCase (ButtonGroup, HeroSection)",
    hooks: "useCamelCase (useTheme, useScrollPosition)",
    files: "kebab-case or lowercase (hero-section.tsx, theme-provider.tsx)",
    folders: "kebab-case (marketing, account-settings)",
    cssModules: "*.module.css",
  },

  componentConventions: {
    componentFilePattern: "components/{Feature}/{Feature}.tsx",
    preferredComponentType: "function components with named exports",
    propsTyping: "explicit TypeScript interfaces",
    clientDirectiveUsage: "use 'use client' only when required",
  },

  stylingConventions: {
    approach: "Tailwind-first with optional CSS modules",
    globalStyles: "app/globals.css",
    cssModulePattern: "*.module.css",
    tailwindConfig: "tailwind.config.ts",
  },

  importConventions: {
    pathAliases: {
      "@": "src",
      "@/components": "src/components",
      "@/lib": "src/lib",
      "@/utils": "src/utils",
    },
    importOrder: [
      "react/next",
      "third-party",
      "absolute aliases",
      "relative",
      "styles",
    ],
  },

  frontendOnlyRules: {
    disallowedPatterns: [
      "app/api/**",
      "getServerSideProps",
      "getStaticProps",
      "getStaticPaths",
      "next/headers",
      "next/server",
      "server actions",
      "\"use server\"",
    ],
    disallowedDirectories: ["app/api", "pages/api"],
    rationale: "The builder currently generates frontend-only code.",
  },

  allowedShadcnComponents: {
    components: [
      {
        name: "button",
        use: "Button",
        path: "components/ui/button.tsx",
      },
      {
        name: "card",
        use: "Card",
        path: "components/ui/card.tsx",
      },
      {
        name: "input",
        use: "Input",
        path: "components/ui/input.tsx",
      },
      {
        name: "badge",
        use: "Badge",
        path: "components/ui/badge.tsx",
      },
      {
        name: "avatar",
        use: "Avatar",
        path: "components/ui/avatar.tsx",
      },
      {
        name: "dropdown-menu",
        use: "DropdownMenu",
        path: "components/ui/dropdown-menu.tsx",
      },
      {
        name: "dialog",
        use: "Dialog",
        path: "components/ui/dialog.tsx",
      },
      {
        name: "sheet",
        use: "Sheet",
        path: "components/ui/sheet.tsx",
      },
      {
        name: "tabs",
        use: "Tabs",
        path: "components/ui/tabs.tsx",
      },
      {
        name: "table",
        use: "Table",
        path: "components/ui/table.tsx",
      },
      {
        name: "tooltip",
        use: "Tooltip",
        path: "components/ui/tooltip.tsx",
      },
    ],
  },
};
