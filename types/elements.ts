// types/elements.ts

import type { CSSProperties } from "react";

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
    style?: CSSProperties;
    onClick?: OnClickAction;

    text?: string;
    src?: string;
    alt?: string;
    href?: string;
    target?: string;
    rel?: string;
    placeholder?: string;
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
