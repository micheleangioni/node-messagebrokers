module.exports = {
  env: {
    browser: false,
    commonjs: true,
    jest: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.eslint.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prefer-arrow', 'sort-class-members'],
  rules: {
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/array-type': 'error',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'error',
    '@typescript-eslint/consistent-type-assertions': 'error',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        'multiline': {
          'delimiter': 'semi',
          'requireLast': true,
        },
        'singleline': {
          'delimiter': 'semi',
          'requireLast': false,
        },
      },
    ],
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/no-empty-interface': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-misused-new': 'error',
    '@typescript-eslint/no-namespace': 'error',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/no-shadow': [
      'error',
      {
        'hoist': 'all',
      },
    ],
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { 'args': 'none', 'vars': 'all' },
    ],
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/prefer-for-of': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    '@typescript-eslint/quotes': [
      'error',
      'single',
      {
        'avoidEscape': true,
      },
    ],
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/triple-slash-reference': 'error',
    '@typescript-eslint/type-annotation-spacing': [
      'error',
      { 'after': true, 'before': false, 'overrides': { 'arrow': { 'after': true, 'before': true }} },
    ],
    '@typescript-eslint/unified-signatures': 'error',
    'array-bracket-spacing': ['error', 'never'],
    'camelcase': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'complexity': 'off',
    'constructor-super': 'error',
    'default-case': 'error',
    'dot-notation': 'error',
    'eol-last': 'error',
    'eqeqeq': ['error', 'smart'],
    'guard-for-in': 'error',
    'key-spacing': [2, {'afterColon': true, 'beforeColon': false, 'mode': 'strict'}],
    'keyword-spacing': ['error', {
      'after': true,
      'before': true,
    }],
    'max-classes-per-file': ['error', 1],
    'max-len': [
      'error',
      {
        'code': 120,
      },
    ],
    'new-parens': 'error',
    'newline-before-return': 'error',
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-cond-assign': 'error',
    'no-debugger': 'error',
    'no-empty': 'error',
    'no-eval': 'error',
    'no-invalid-this': 'off',
    'no-multi-spaces': 'error',
    'no-multiple-empty-lines': [2, {'max': 1, 'maxBOF': 1, 'maxEOF': 1}],
    'no-new-wrappers': 'error',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'error',
    'no-undef-init': 'error',
    'no-unsafe-finally': 'error',
    'no-unused-expressions': [
      'error',
      { 'allowShortCircuit': true, 'allowTernary': true },
    ],
    'no-unused-labels': 'error',
    'no-unused-vars': 'off',
    'no-var': 'error',
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'padding-line-between-statements': [
      'error',
      {
        'blankLine': 'always',
        'next': '*',
        'prev': 'block-like',
      }, {
        'blankLine': 'always',
        'next': 'block-like',
        'prev': '*',
      }, {
        'blankLine': 'never',
        'next': 'case',
        'prev': 'block-like',
      }, {
        'blankLine': 'never',
        'next': 'default',
        'prev': 'block-like',
      },
    ],
    'prefer-arrow/prefer-arrow-functions': 'error',
    'prefer-const': 'error',
    'sort-class-members/sort-class-members': [2, {
      'accessorPairPositioning': 'getThenSet',
      'order': [
        '[static-properties]',
        '[static-methods]',
        '[properties]',
        '[conventional-private-properties]',
        'constructor',
        '[getters]',
        '[setters]',
        '[methods]',
        '[conventional-private-methods]',
      ],
    }],
    'sort-keys': 'error',
    'space-before-function-paren': [
      'error',
      {
        'anonymous': 'always',
        'asyncArrow': 'always',
        'named': 'never',
      },
    ],
    'space-in-parens': ['error', 'never'],
    'spaced-comment': 'error',
    'valid-typeof': 'off',
  },
  settings: {},
};