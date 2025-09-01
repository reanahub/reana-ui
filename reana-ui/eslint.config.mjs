// Most of this file is created via running `yarn dlx @eslint/migrate-config .eslintrc.json` on top of our old `.eslintrc.json` file
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import prettier from "eslint-plugin-prettier";
import babelParser from "@babel/eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...fixupConfigRules(
    compat.extends("plugin:prettier/recommended", "react-app", "prettier"),
  ),
  {
    plugins: {
      prettier: fixupPluginRules(prettier),
    },

    languageOptions: {
      parser: babelParser,
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        requireConfigFile: false,
        sourceType: "module",
        ecmaVersion: 2022,

        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
    },

    rules: {
      "prettier/prettier": "error",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
];
