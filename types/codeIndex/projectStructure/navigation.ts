export interface navigation {
  routes: routes;
  pages: pages;
  layouts: layouts;
}

export interface routes {
  [key: string]: route;
}

export interface route {
  page_id: string;
  layout_id: string;
}

export interface pages {
  [key: string]: page;
}

export interface page {
  route: string;
  file: string;
  description: string;
}

export interface layouts {
  [key: string]: layout;
}

export interface layout {
  route: string;
  file: string;
  description: string;
}
