const examples = [
  `### Example 1 — Basic centered page

USER TASK:
Create a simple homepage with a heading and a button centered on screen.

OUTPUT (page.config.ts):

export const config = {
  elements: [
    {
      id: "root",
      type: "div",
      className: "h-screen flex flex-col items-center justify-center gap-4",
      children: [
        {
          id: "heading",
          type: "text",
          props: { text: "Welcome to the app" },
          className: "text-3xl font-semibold"
        },
        {
          id: "cta",
          type: "button",
          props: { text: "Get Started" },
          className: "px-4 py-2 bg-black text-white rounded-md"
        }
      ]
    }
  ]
};`,

  `
### Example 2 — Input with button row

USER TASK:
Create a bottom input bar with an input and send button.

OUTPUT (page.config.ts):

export const config = {
  elements: [
    {
      id: "root",
      type: "div",
      className: "h-screen flex flex-col justify-end",
      children: [
        {
          id: "input-bar",
          type: "div",
          className: "flex gap-2 p-4 border-t",
          children: [
            {
              id: "input",
              type: "input",
              props: { placeholder: "Type a message..." },
              className: "flex-1 border rounded px-3 py-2"
            },
            {
              id: "send",
              type: "button",
              props: { text: "Send" },
              className: "bg-black text-white px-4 py-2 rounded"
            }
          ]
        }
      ]
    }
  ]
};
`,
  `
### Example 3 — Navigation link

USER TASK:
Create a simple page with a link to another page.

OUTPUT (page.config.ts):

export const config = {
  elements: [
    {
      id: "root",
      type: "div",
      className: "p-6",
      children: [
        {
          id: "link",
          type: "link",
          props: {
            href: "/about",
            text: "Go to About"
          },
          className: "text-blue-600 underline"
        }
      ]
    }
  ]
};`,
];

export const codegenExamples = examples.join("\n");
