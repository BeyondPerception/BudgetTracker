#!/bin/bash

set -e

echo "Generating OpenAPI spec from code..."
cd backend && cargo run --bin generate-spec
cd ..

echo "📋 Generating TypeScript client..."
cd frontend && npm run generate-api-local
cd ..

echo "✅ API generation complete!"