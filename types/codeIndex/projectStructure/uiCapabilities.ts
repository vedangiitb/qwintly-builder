export interface uiCapabilities {
  components: components;
}

export interface components {
  [key: string]: component;
}

export interface component {
  kind: componentKind;
  file: string;
  description: string;
  used_in: used_in;
  uses: string[];
}

interface used_in {
  pages: string[];
  layouts: string[];
  components: string[];
}

type componentKind = "ui_element" | "section";
