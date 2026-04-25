import { mdSection } from "./promptParts.helper.js";

export type UiConstraintsTarget = "planner" | "codegen";

export const uiArchitectureConstraint = mdSection(
  "UI Architecture Constraint (CRITICAL)",
  `
This project uses a config-driven UI system with a reusable renderer.

Core pattern (STRICT) for every route:
- Route folder: \`app/<route>/\`
- Must contain: \`page.tsx\` and \`page.config.ts\`

Responsibilities:
- \`page.config.ts\` defines UI using structured data (BuilderElement[])
- \`page.tsx\` renders config using \`RenderElement\` (do not reimplement rendering in pages)

Rendering sketch (for understanding only; do not copy into page files):
// lib/renderer/RenderElement.tsx
export function RenderElement({ el }: { el: BuilderElement }) {
  if (el.visible === false) return null;
  const renderer = registry[el.type];
  return renderer(el);
}

// lib/renderer/registry.tsx
export const registry: Partial<Record<ElementType, ElementRenderer>> = {
  fragment: (el) => <>{renderChildren(el.children)}</>,
  div: (el) => (
    <div id={el.id} className={twMerge(el.className)}>
      {renderChildren(el.children)}
    </div>
  ),
  text: (el) => (
    <p id={el.id} className={twMerge(el.className)}>
      {el.props?.text}
    </p>
  ),
  image: (el) => {
    if (!el.props?.src) return null;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        id={el.id}
        className={twMerge(el.className)}
        src={el.props.src}
        alt={el.props.alt ?? ""}
      />
    );
  },
  input: (el) => (
    <input
      id={el.id}
      className={twMerge(el.className)}
      placeholder={el.props?.placeholder}
      type={el.props?.type || "text"}
      defaultValue={el.props?.value}
    />
  ),
  textarea: (el) => (
    <textarea
      id={el.id}
      className={twMerge(el.className)}
      placeholder={el.props?.placeholder}
      defaultValue={el.props?.value}
    />
  ),
  link: (el) => (
    <a
      id={el.id}
      className={twMerge(el.className)}
      href={el.props?.href ?? "#"}
      target={el.props?.target}
      rel={el.props?.rel}
    >
      {el.children?.length ? renderChildren(el.children) : el.props?.text}
    </a>
  ),
  icon: (el) => {
    const iconName = el.props?.name ?? el.meta?.name;
    if (!iconName) return null;

    const LucideIcon = icons[iconName as keyof typeof icons];
    if (!LucideIcon) return null;

    return (
      <LucideIcon
        id={el.id}
        className={twMerge(el.className)}
        size={el.props?.size}
        color={el.props?.color}
        strokeWidth={el.props?.strokeWidth}
      />
    );
  },
  button: (el) => (
    <button id={el.id} className={twMerge(el.className)}>
      {el.children?.length ? renderChildren(el.children) : el.props?.text}
    </button>
  ),
};

NO JSX-based UI definitions inside config files.
  `.trim(),
);

export const configSchema = mdSection(
  "Config Schema (STRICT - do not deviate)",
  `
Each \`page.config.ts\` MUST export:

export const config = { elements: BuilderElement[] }

Canonical types:
export type ElementType =
  | "fragment"
  | "div"
  | "text"
  | "image"
  | "button"
  | "input"
  | "textarea"
  | "link"
  | "icon";

export type BuilderElement = {
  id: string;
  type: ElementType;
  props?: {
    text?: string;
    src?: string;
    alt?: string;
    href?: string;
    target?: string;
    rel?: string;
    placeholder?: string;
    value?: string;
    type?: string;
    name?: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
  };
  children?: BuilderElement[];
  visible?: boolean;
  meta?: { name?: string; locked?: boolean };
  className?: string; // Tailwind only
};

Smart conventions (recommended):
- The top-level element SHOULD be { id: "root", type: "div", children: [...] }.
- When a page has multiple sections, make each top-level section a div child of root with ids ending in -section (e.g., hero-section, pricing-section).
- Use wrapper ids ending in -container when helpful (e.g., hero-container).
  `.trim(),
);

export const contentRequirements = mdSection(
  "Content Requirements (CRITICAL)",
  `
- UI MUST render meaningful visible content immediately.
- Use realistic UI patterns (forms, layouts, buttons, inputs, etc.).
- DO NOT generate empty elements.
- Prefer shallow, clean trees; avoid deeply nested wrappers.
  `.trim(),
);

export const invalidStructures = mdSection(
  "Invalid Structures",
  `
- Elements with missing required props (e.g., image without src).
- Invalid type names (must match ElementType exactly).
- Invalid Tailwind classes (avoid obvious typos).
- Deeply nested div chains with no purpose.
  `.trim(),
);

export const stylingRules = mdSection(
  "Styling Rules (STRICT)",
  `
- Use ONLY Tailwind classes via className.
- DO NOT use inline styles or style objects.
- Prefer simple layouts: "flex flex-col gap-4", "grid gap-4", "p-4".
  `.trim(),
);

export const validOutput = mdSection(
  "Minimum Valid Output",
  `
At least one visible UI element:
{
  elements: [
    {
      id: "root",
      type: "div",
      className: "p-4",
      children: [{ id: "text-1", type: "text", props: { text: "Hello world" } }]
    }
  ]
}
  `.trim(),
);

export const hardConstraints = mdSection(
  "Hard Constraints",
  `
- DO NOT introduce complex abstractions (schema layers, DSL layers).
- DO NOT hardcode UI in page.tsx.
- DO NOT modify shadcn components in components/ui.
- DO NOT add unnecessary libraries.
  `.trim(),
);

const pageImplementationRules = mdSection(
  "Page Implementation Rules (STRICT)",
  `
page.tsx MUST:
- import config
- import RenderElement
- render config.elements via <RenderElement />

DO NOT:
- define RenderElement locally
- write custom JSX UI in page.tsx
- bypass config
  `.trim(),
);

export const renderUiConstraints = (target: UiConstraintsTarget) => {
  const parts = [
    uiArchitectureConstraint,
    configSchema,
    contentRequirements,
    invalidStructures,
    stylingRules,
    validOutput,
    target === "codegen" ? pageImplementationRules : "",
    hardConstraints,
  ].filter((p) => p.trim().length > 0);

  return parts.join("\n\n---\n\n");
};
