// @ts-check

import globals from "globals";
import js from "@eslint/js";
import json from "@eslint/json";
import css from "@eslint/css";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: [".venv/", "node_modules/", "src/scicat_widget/_static/"],
    },
    {
        files: ["js/**/*.{js,ts}"],
        plugins: { js },
        extends: ["js/recommended"],
        languageOptions: { globals: globals.browser },
    },
    {
        files: ["**/*.json"],
        ignores: ["package-lock.json"],
        plugins: { json },
        language: "json/json",
        extends: ["json/recommended"],
    },
    {
        files: ["js/**/*.css"],
        plugins: { css },
        language: "css/css",
        extends: ["css/recommended"],
    },
    {
        files: ["js/**/*.ts"],
        plugins: { tseslint },
        extends: ["tseslint/strictTypeChecked", "tseslint/stylisticTypeChecked"],
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
        rules: {
            "@typescript-eslint/consistent-type-definitions": "off",
        },
    },
]);
