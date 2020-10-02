import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/index.js",
    plugins: [terser()],
    output: {
      file: "dist/umd/js-db.js",
      format: "umd",
      name: "jsdb",
      esModule: false,
    },
  },
  {
    input: { index: "src/index.js" },
    output: [
      { dir: "dist/esm", format: "esm" },
      {
        dir: "dist/cjs",
        format: "cjs",
      },
    ],
  },
];
