// Most of this file is created via running `yarn dlx @eslint/migrate-config .eslintrc.json` on top of our old `.eslintrc.json` file
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import prettier from "eslint-plugin-prettier";
import babelParser from "@babel/eslint-parser";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  ...fixupConfigRules(
    compat.extends("plugin:prettier/recommended", "react-app", "prettier"),
  ),
  // JS/JSX files: keep the existing Babel-based parser
  {
    files: ["**/*.js", "**/*.jsx"],
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
  // TS/TSX files: use the TypeScript parser and plugin
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      prettier: fixupPluginRules(prettier),
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "prettier/prettier": "error",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      // Relax during migration — tighten once all files are .tsx
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];
