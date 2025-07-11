@echo off
echo Installing authentication dependencies with legacy peer deps...

echo.
echo Installing production dependencies...
npm install --legacy-peer-deps speakeasy qrcode zod

echo.
echo Installing dev dependencies...
npm install --save-dev --legacy-peer-deps @types/speakeasy @types/qrcode husky lint-staged @commitlint/cli @commitlint/config-conventional

echo.
echo Authentication dependencies installed successfully!
echo.

echo Setting up Husky...
npx husky init

echo.
echo Setup complete!
pause