@echo off
echo Installing authentication dependencies...

npm install --save speakeasy qrcode zod crypto-js
npm install --save-dev @types/speakeasy @types/qrcode @types/crypto-js husky lint-staged @commitlint/cli @commitlint/config-conventional

echo.
echo Authentication dependencies installed successfully!
echo.

echo Setting up Husky...
npx husky init
echo.

echo Creating pre-commit hook...
echo npx lint-staged > .husky\pre-commit

echo.
echo Setup complete!
pause