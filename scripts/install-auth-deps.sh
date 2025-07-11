#!/bin/bash

# Install authentication dependencies
npm install --save \
  speakeasy \
  qrcode \
  @types/speakeasy \
  @types/qrcode \
  zod \
  crypto-js \
  @types/crypto-js

# Dev dependencies for testing and security
npm install --save-dev \
  husky \
  lint-staged \
  @commitlint/cli \
  @commitlint/config-conventional

echo "Authentication dependencies installed successfully!"