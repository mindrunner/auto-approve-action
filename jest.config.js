import { createDefaultEsmPreset } from "ts-jest";

export default {
  ...createDefaultEsmPreset(),
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
