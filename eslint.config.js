// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import pluginReactJsxRuntime from "eslint-plugin-react/configs/jsx-runtime.js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginImport from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier"; // Config, not plugin

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] }, // Apply broadly first

  // Base recommended rules
  pluginJs.configs.recommended,

  // TypeScript specific setup
  {
    files: ["**/*.{ts,tsx}"], // Target TS/TSX files
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
        ecmaFeatures: { jsx: true },
      },
      // Explicitly define common globals instead of spreading potentially problematic defaults
      globals: {
        // Browser Globals (Common Examples)
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        // ES2020 Globals (Common Examples)
        Promise: "readonly",
        Map: "readonly",
        Set: "readonly",
        Symbol: "readonly",
        BigInt: "readonly",
        globalThis: "readonly",
        // Add others if needed based on lint errors
      },
    },
    plugins: {
      "@typescript-eslint": tseslint, // Use the plugin object
      import: pluginImport, // Use the plugin object
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true, // Treat checkJs files as TS for type checking
          project: "./tsconfig.json",
        }
      }
    },
    rules: {
      // Apply recommended type-aware TS rules (stricter)
      ...tseslint.configs['recommended-type-checked'].rules,
      ...pluginImport.configs.recommended.rules, // Apply recommended import rules
      ...pluginImport.configs.typescript.rules, // Apply TS import rules

      // Migrated/Equivalent Rules from tslint.json/old eslintrc:
      'linebreak-style': ['warn', 'unix'],
      'no-console': ['warn', { allow: ['error'] }],
      '@typescript-eslint/no-invalid-this': 'warn',
      'import/no-default-export': 'warn',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/naming-convention': [
        'warn',
        { selector: 'variableLike', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
      ],
      'no-restricted-syntax': [ // Keep the ban rules
        'warn',
        { selector: "MemberExpression[object.name='_'][property.name='extend']", message: 'Use object spread syntax `{...obj}` instead of `_.extend`.' },
        { selector: "MemberExpression[object.name='_'][property.name='isNull']", message: 'Use plain JS `obj === null` instead of `_.isNull`.' },
        { selector: "MemberExpression[object.name='assert'][property.name='equal']", message: 'Use `assert.strictEqual` instead of `assert.equal`.' },
        { selector: "MemberExpression[object.name='describe'][property.name='only']", message: '`describe.only` should not be committed.' },
        { selector: "MemberExpression[object.name='it'][property.name='only']", message: '`it.only` should not be committed.' },
        { selector: "CallExpression[callee.object.name='Object'][callee.property.name='assign']", message: 'Use object spread syntax `{...obj}` instead of `Object.assign`.' },
        { selector: "MemberExpression[object.name='test'][property.name='only']", message: '`test.only` should not be committed.' }
      ],
    }
  },

  // React specific setup (applied after TS/general setup)
  {
    files: ["**/*.{jsx,tsx}"], // Target JSX/TSX files
    ...pluginReactConfig, // Apply base recommended React rules (includes parser options, settings etc.)
    settings: { // Ensure settings are merged/set correctly
      react: { version: 'detect' },
      ...pluginReactConfig.settings // Merge existing settings if any
    },
    plugins: { // Add React/Hooks plugins here for JSX/TSX files
      ...pluginReactConfig.plugins, // Merge existing plugins if any
      'react-hooks': pluginReactHooks, // Use the plugin object
    },
    rules: {
      ...pluginReactConfig.rules, // Base React rules
      ...pluginReactJsxRuntime.rules, // New JSX transform rules
      ...pluginReactHooks.configs.recommended.rules, // React Hooks rules
      'react/prop-types': 'off', // Turn off prop-types as we use TS
    }
  },

  // Prettier compatibility - MUST be LAST!
  eslintConfigPrettier,

  // Ignore patterns (alternative way in flat config)
  {
    ignores: ["build/", "dist/", "eslint.config.js", "vite.config.ts"],
  }
]; 