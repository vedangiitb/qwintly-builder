import { infra } from "./infra.js";
import { logicCapabilies } from "./logicCapabilies.js";
import { navigation } from "./navigation.js";
import { uiCapabilities } from "./uiCapabilities.js";

export interface projectStructure {
  navigation: navigation;
  uiCapabilities: uiCapabilities;
  logicCapabilies: logicCapabilies;
  infra: infra;
}
