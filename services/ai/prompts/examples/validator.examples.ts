const examples = [
  `### Example 1 - Fix schema mismatch + element type issues

VALIDATION ERRORS (input):
- Type: typescript
  File: app/page.config.ts
  Message: Property 'elements' is missing in type '{ element: ... }' but required in type '{ elements: BuilderElement[] }'.
- Type: runtime
  File: app/page.config.ts
  Message: Invalid element type "Button" (must match ElementType exactly).

FIX HISTORY (input):
- File: app/page.config.ts
  Fix Attempted: "Renamed some ids and added wrappers" (error still persists).

OUTPUT (submit_planner_tasks):
{
  "planner_tasks": [
    {
      "description": "Update app/page.config.ts to export exactly: export const config = { elements: BuilderElement[] }. Ensure the top-level shape is { elements: [...] } (not element/children). Preserve existing UI intent where possible; minimal diff.",
      "targets": ["app/page.config.ts"]
    },
    {
      "description": "In app/page.config.ts, replace any invalid element type strings (e.g., 'Button') with the correct lowercase ElementType values (e.g., 'button'). Ensure every element has an id and supported props only.",
      "targets": ["app/page.config.ts"]
    },
    {
      "description": "Re-run the mental validation against the schema: config.elements must be an array; image must have props.src; links should have props.href; remove any now-dead wrappers created by the previous fix if they do not add layout value.",
      "targets": ["app/page.config.ts"]
    }
  ]
}`,

  `
### Example 2 - Fix page.tsx hardcoded JSX + missing config import

VALIDATION ERRORS (input):
- Type: build
  File: app/about/page.tsx
  Message: Do not hardcode UI in page.tsx. This project requires config-driven rendering via the shared renderer.
- Type: typescript
  File: app/about/page.tsx
  Message: Cannot find module './page.config' or its corresponding type declarations.

FIX HISTORY (input):
- File: app/about/page.tsx
  Fix Attempted: "Copied JSX from another page directly into page.tsx".

OUTPUT (submit_planner_tasks):
{
  "planner_tasks": [
    {
      "description": "Update app/about/page.tsx to render UI strictly from config: import config from './page.config' and render config.elements through the shared RenderElement-based renderer used in other routes (search and reuse the existing pattern). Remove any hardcoded JSX UI from the page component.",
      "targets": ["app/about/page.tsx"]
    },
    {
      "description": "Create app/about/page.config.ts exporting { elements }. Include at least one visible text element (e.g., heading + short paragraph) under a root div with reasonable Tailwind spacing.",
      "targets": ["app/about/page.config.ts"]
    },
  ]
}`,

  `
### Example 3 - Fix invalid image/link structures without silencing errors

VALIDATION ERRORS (input):
- Type: runtime
  File: app/landing/page.config.ts
  Message: Invalid structure: image element missing props.src (renderer returns null).
- Type: runtime
  File: app/landing/page.config.ts
  Message: Link element missing href and has no children/text (renders empty).

FIX HISTORY (input):
- No previous fixes attempted.

OUTPUT (submit_planner_tasks):
{
  "planner_tasks": [
    {
      "description": "Update app/landing/page.config.ts to ensure every image element has props.src (and optionally props.alt). If the intent was a placeholder, replace it with a valid text element instead of leaving an invalid image.",
      "targets": ["app/landing/page.config.ts"]
    },
    {
      "description": "Update app/landing/page.config.ts to ensure every link element has either props.href + props.text OR children that render visible content. Remove empty links; keep the UI meaningful and visible immediately.",
      "targets": ["app/landing/page.config.ts"]
    },
    {
      "description": "Quick pass in app/landing/page.config.ts to remove any empty div wrappers and fix obvious Tailwind typos introduced during edits; keep the element tree shallow and purposeful.",
      "targets": ["app/landing/page.config.ts"]
    }
  ]
}`,
];

export const validatorExamples = examples.join("\n");
