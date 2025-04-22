module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'], // Point to your tsconfig.json
    ecmaFeatures: {
      jsx: true, // Enable JSX parsing
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'import', // Added for no-default-export
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Base TS rules
    'plugin:react/recommended', // Base React rules
    'plugin:react/jsx-runtime', // Use new JSX transform from React 17+
    'plugin:react-hooks/recommended', // Rules for Hooks
    'plugin:import/recommended', // Base import rules
    'plugin:import/typescript', // TS support for import rules
    'eslint-config-prettier', // IMPORTANT: Disables rules that conflict with Prettier - Must be LAST!
  ],
  settings: {
    react: {
      version: 'detect', // Automatically detect React version
    },
    'import/resolver': {
      typescript: true, // Help import plugin find modules with TS paths
      node: true,
    },
  },
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'], // Ignore build output, this file, vite config
  rules: {
    // Migrated/Equivalent Rules from tslint.json:
    'linebreak-style': ['warn', 'unix'], // TSLint: linebreak-style ["LF"]
    'no-console': ['warn', { allow: ['error'] }], // TSLint: no-console ["log", "warn"] - Allow console.error
    '@typescript-eslint/no-invalid-this': 'warn', // TSLint: no-invalid-this ["check-function-in-method"]
    'import/no-default-export': 'warn', // TSLint: no-default-export
    '@typescript-eslint/no-unnecessary-initializer': 'warn', // TSLint: no-unnecessary-initializer
    // TSLint: "ban" rules translation (using no-restricted-syntax - adjust selectors as needed)
    'no-restricted-syntax': [
      'warn',
      {
        selector: "MemberExpression[object.name='_'][property.name='extend']",
        message: 'Use object spread syntax `{...obj}` instead of `_.extend`.',
      },
      {
        selector: "MemberExpression[object.name='_'][property.name='isNull']",
        message: 'Use plain JS `obj === null` instead of `_.isNull`.',
      },
      // isDefined is harder to map directly, often replaced by `!= null` or `!== undefined` checks
      {
        selector: "MemberExpression[object.name='assert'][property.name='equal']",
        message: 'Use `assert.strictEqual` instead of `assert.equal`.',
      },
      {
        selector: "MemberExpression[object.name='describe'][property.name='only']",
        message: '`describe.only` should not be committed.',
      },
      {
        selector: "MemberExpression[object.name='it'][property.name='only']",
        message: '`it.only` should not be committed.',
      },
      {
        selector: "CallExpression[callee.object.name='Object'][callee.property.name='assign']",
        message: 'Use object spread syntax `{...obj}` instead of `Object.assign`.',
      },
      // Object.keys() is generally preferred over getOwnPropertyNames unless non-enumerable needed
      // {
      //   selector: "CallExpression[callee.object.name='Object'][callee.property.name='getOwnPropertyNames']",
      //   message: 'Consider using `Object.keys()` unless non-enumerable properties are needed.',
      // },
       {
        selector: "MemberExpression[object.name='test'][property.name='only']",
        message: '`test.only` should not be committed.',
      }
    ],
    // TSLint: "variable-name" translation (using @typescript-eslint/naming-convention)
    // This is a basic setup, might need refinement based on specific needs from tslint config
    '@typescript-eslint/naming-convention': [
      'warn',
      { // Allow leading underscore (e.g., for unused vars)
        selector: 'variableLike',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
       { // Allow PascalCase for types/interfaces/enums/classes
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],
    // TSLint: no-empty-interface (disabled) -> ESLint default allows, but can explicitly disable if needed
    '@typescript-eslint/no-empty-interface': 'off',

    // Optional: Add other common rules or adjustments
    'react/prop-types': 'off', // Not needed with TypeScript
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Warn on unused vars, ignore if prefixed with _
  },
}; 