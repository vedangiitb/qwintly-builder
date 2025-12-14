export const initProjectPrompt = (request: string) => `
You are a senior software architect.

Create a file and folder structure for this project:
- Type: Next.js app
- Goal: ${request}
- Stack: Next.js, TypeScript, Tailwind

Rules:
- Output MUST use the create_structure tool
- Do NOT generate code yet
- Include clear purpose for every file
`;
