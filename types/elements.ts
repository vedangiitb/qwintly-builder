// types/elements.ts


export const ELEMENT_TYPES = [
  "fragment",
  "div",
  "text",
  "image",
  "button",
  "input",
  "textarea",
  "link",
  "icon",
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

export type OnClickAction =
  | { kind: "route"; href: string; replace?: boolean }
  | { kind: "back" }
  | { kind: "reload" }
  | { kind: "external"; href: string; newTab?: boolean };

export type BuilderElement = {
  id: string;
  type: ElementType;

  props?: {
    onClick?: OnClickAction;

    text?: string;
    src?: string;
    href?: string;
    placeholder?: string;
    alt?: string;
    target?: string;
    rel?: string;
    value?: string;
    type?: string; // input type

    // icon
    name?: string;
    size?: number;
    color?: string;
    strokeWidth?: number;
  };

  children?: BuilderElement[];

  visible?: boolean;

  meta?: {
    name?: string;
    locked?: boolean;
  };

  className?: string; // Tailwind only
};
