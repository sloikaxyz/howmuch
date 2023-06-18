const path = require("path");

/** @type {import("lint-staged").Config} */
const config = {
  "*.{js,cjs,mjs,jsx,ts,tsx}": (filenames) => [
    // Lint TypeScript and JavaScript files
    // cf. https://github.com/okonet/lint-staged#integrate-with-nextjs
    `yarn lint:precommit --file ${filenames
      .map((f) => `'${path.relative(process.cwd(), f)}'`)
      .join(" --file ")}`,

    // Check types for the entire project
    "yarn tsc:typecheck",
  ],
  // we want to lint the entire project when changing dependencies
  // or changing config files
  "(.eslintrc.cjs|prettier.config.cjs|package.json|yarn.lock)": () => [
    "yarn lint:ci:all",
    "yarn tsc:typecheck",
  ],
};

module.exports = config;
