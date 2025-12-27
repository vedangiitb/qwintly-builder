export interface infra {
  [key: string]: infraItem;
}

interface infraItem {
  platform: string;
  type: string;
  required_keys: string[];
}
