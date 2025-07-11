const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Add new scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "type-check": "tsc --noEmit",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "prepare": "husky install",
  "pre-commit": "lint-staged",
  "security:check": "npm audit --audit-level=moderate",
  "db:migrate": "node scripts/run-migrations.js",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
};

// Add lint-staged configuration
packageJson["lint-staged"] = {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
};

// Add commitlint configuration
packageJson.commitlint = {
  extends: ["@commitlint/config-conventional"]
};

fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('Package.json scripts updated successfully!');