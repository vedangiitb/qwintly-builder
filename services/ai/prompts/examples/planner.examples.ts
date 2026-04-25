const examples = [
  `### Example 1 - New route + minimal navigation update

PM PLAN (high-level):
- Add a /pricing page with a hero, feature highlights, and a clear CTA.
- Add a "Pricing" link on the home page.

OUTPUT (submit_planner_tasks):
{
  "planner_tasks": [
    {
      "description": "Create app/pricing/page.tsx to render the pricing page from config using the shared RenderElement-based renderer used across routes (search for existing RenderElement usage and reuse that import/pattern; do not implement a new renderer).",
      "targets": ["app/pricing/page.tsx"]
    },
    {
      "description": "Create app/pricing/page.config.ts exporting { elements: BuilderElement[] }. Include a root div with a hero section (headline + supporting text), a simple 3-item feature row, and a CTA button. Use only supported element types and Tailwind classes; no JSX in config.",
      "targets": ["app/pricing/page.config.ts"]
    },
    {
      "description": "Update app/page.config.ts to add a small top nav row containing a link element to /pricing (text: Pricing). Keep existing page content intact; minimal diff; ensure ids remain unique.",
      "targets": ["app/page.config.ts"]
    }
  ]
}`,

  `
### Example 2 - Incremental redesign with a new section and icon usage

PM PLAN (high-level):
- Improve the homepage layout: add a features section with icons and short copy.
- Add a footer row with links to /about and /contact.

OUTPUT (submit_planner_tasks):
{
  "planner_tasks": [
    {
      "description": "Read app/page.config.ts to understand the existing element tree and current ids/sections. Identify where to insert a new features-section under root without restructuring unrelated elements.",
      "targets": ["app/page.config.ts"]
    },
    {
      "description": "Update app/page.config.ts by adding a new div child under root with id 'features-section'. Inside it, create a simple 3-column grid of feature cards; each card should include an icon element (lucide name via props.name), a text heading, and a short supporting text. Keep the tree shallow and use Tailwind for spacing/typography.",
      "targets": ["app/page.config.ts"]
    },
    {
      "description": "Update app/page.config.ts by adding a footer-section at the bottom with two link elements: one to /about and one to /contact. Use clear link text and basic styling (e.g., underline + muted color).",
      "targets": ["app/page.config.ts"]
    }
  ]
}`,

  `
### Example 3 - Multi-route addition (contact flow) with strict config-driven pages

PM PLAN (high-level):
- Add a /contact page with a simple form (name, email, message, submit).
- After submit, provide a /contact/thanks page that confirms receipt (static UI).
- Add a "Contact" link somewhere visible on the homepage.

OUTPUT (submit_planner_tasks):
{
  "planner_tasks": [
    {
      "description": "Create app/contact/page.tsx to render the contact page from its config using the shared RenderElement-based renderer pattern used in other routes.",
      "targets": ["app/contact/page.tsx"]
    },
    {
      "description": "Create app/contact/page.config.ts exporting { elements }. Build a visible form layout: heading text, two input elements (placeholders: Name, Email; set email input props.type='email'), one textarea (placeholder: Message), and a submit button. Use simple spacing and borders via Tailwind; do not generate empty wrappers.",
      "targets": ["app/contact/page.config.ts"]
    },
    {
      "description": "Create app/contact/thanks/page.tsx to render the thanks page from config using the shared renderer pattern (no hardcoded JSX UI).",
      "targets": ["app/contact/thanks/page.tsx"]
    },
    {
      "description": "Create app/contact/thanks/page.config.ts exporting { elements } with a short confirmation message and a link back to /. Keep it visually clear (e.g., centered container with padding).",
      "targets": ["app/contact/thanks/page.config.ts"]
    },
    {
      "description": "Update app/page.config.ts to add a link element pointing to /contact with text 'Contact'. Place it in an existing header/nav area if present; otherwise add a minimal nav row at the top of root.",
      "targets": ["app/page.config.ts"]
    }
  ]
}`,
];

export const plannerExamples = examples.join("\n");
