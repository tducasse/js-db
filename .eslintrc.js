module.exports = {
  plugins: ["prettier", "jest"],
  env: {
    "jest/globals": true,
    browser: true,
    es2021: true,
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "prettier/prettier": "error",
    "no-console": 0,
  },
};
