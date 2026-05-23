export const STYLE_TOKEN_KEYS = [
  "radius",
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "border",
  "input",
  "ring",
  "chart1",
  "chart2",
  "chart3",
  "chart4",
  "chart5",
  "sidebar",
  "sidebarForeground",
  "sidebarPrimary",
  "sidebarPrimaryForeground",
  "sidebarAccent",
  "sidebarAccentForeground",
  "sidebarBorder",
  "sidebarRing",
] as const;

export type StyleTokenKey = (typeof STYLE_TOKEN_KEYS)[number];

export type StyleConfig = {
  version: number;
  tokens: Record<StyleTokenKey, string>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertSafeCssValue(key: string, value: string) {
  if (!value.trim()) {
    throw new Error(`styleConfig.tokens.${key} must be a non-empty string`);
  }
  if (value.includes("<") || value.includes(">")) {
    throw new Error(`styleConfig.tokens.${key} contains forbidden characters`);
  }
  if (value.toLowerCase().includes("</style")) {
    throw new Error(
      `styleConfig.tokens.${key} contains a forbidden substring ("</style")`,
    );
  }
}

export function assertStyleConfig(config: unknown): StyleConfig {
  if (!isPlainObject(config)) throw new Error("styleConfig must be an object");

  const version = config.version;
  if (typeof version !== "number" || !Number.isFinite(version)) {
    throw new Error("styleConfig.version must be a finite number");
  }

  const tokens = (config as Record<string, unknown>).tokens;
  if (!isPlainObject(tokens))
    throw new Error("styleConfig.tokens must be an object");

  const resolvedTokens = {} as Record<StyleTokenKey, string>;
  for (const key of STYLE_TOKEN_KEYS) {
    const rawValue = (tokens as Record<string, unknown>)[key];
    if (typeof rawValue !== "string") {
      throw new Error(`styleConfig.tokens.${key} must be a string`);
    }
    assertSafeCssValue(key, rawValue);
    resolvedTokens[key] = rawValue;
  }

  const extraKeys = Object.keys(tokens).filter(
    (k) => !(STYLE_TOKEN_KEYS as readonly string[]).includes(k),
  );
  if (extraKeys.length) {
    throw new Error(
      `styleConfig.tokens contains unknown keys: ${extraKeys
        .sort()
        .join(", ")}`,
    );
  }

  return { version, tokens: resolvedTokens };
}

export const defaultStyleConfigJson = {
  version: 1,
  tokens: {
    radius: "0.85rem",
    background: "oklch(0.985 0.008 80.2)",
    foreground: "oklch(0.2 0.03 255.4)",
    card: "oklch(0.995 0.004 80.2)",
    cardForeground: "oklch(0.2 0.03 255.4)",
    popover: "oklch(0.995 0.004 80.2)",
    popoverForeground: "oklch(0.2 0.03 255.4)",
    primary: "oklch(0.62 0.16 199.4)",
    primaryForeground: "oklch(0.985 0.008 80.2)",
    secondary: "oklch(0.94 0.02 83.1)",
    secondaryForeground: "oklch(0.22 0.04 258.2)",
    muted: "oklch(0.95 0.01 85.6)",
    mutedForeground: "oklch(0.46 0.04 257.6)",
    accent: "oklch(0.9 0.06 78.4)",
    accentForeground: "oklch(0.22 0.04 258.2)",
    destructive: "oklch(0.57 0.21 25.6)",
    border: "oklch(0.89 0.02 82.5)",
    input: "oklch(0.92 0.02 82.5)",
    ring: "oklch(0.62 0.16 199.4)",
    chart1: "oklch(0.62 0.16 199.4)",
    chart2: "oklch(0.66 0.14 143.6)",
    chart3: "oklch(0.52 0.12 297.6)",
    chart4: "oklch(0.74 0.16 79.3)",
    chart5: "oklch(0.62 0.18 24.8)",
    sidebar: "oklch(0.975 0.01 82.5)",
    sidebarForeground: "oklch(0.2 0.03 255.4)",
    sidebarPrimary: "oklch(0.62 0.16 199.4)",
    sidebarPrimaryForeground: "oklch(0.985 0.008 80.2)",
    sidebarAccent: "oklch(0.94 0.02 83.1)",
    sidebarAccentForeground: "oklch(0.22 0.04 258.2)",
    sidebarBorder: "oklch(0.89 0.02 82.5)",
    sidebarRing: "oklch(0.62 0.16 199.4)",
  },
};
