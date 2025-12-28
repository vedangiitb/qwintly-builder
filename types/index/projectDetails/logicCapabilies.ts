export interface LogicCapabilities {
  services: services;
  hooks: hooks;
  lib: lib;
  utils: utils;
}

interface services {
  [key: string]: service;
}

interface service {
  file: string;
  description: string;
}

interface hooks {
  [key: string]: hook;
}

interface hook {
  file: string;
  description: string;
}

interface lib {
  [key: string]: libItem;
}

interface libItem {
  file: string;
  description: string;
}

interface utils {
  [key: string]: util;
}

interface util {
  file: string;
  description: string;
}