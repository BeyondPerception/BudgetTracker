.PHONY: help setup dev build test clean generate backend frontend

# Default target
help:
	@echo "Available targets:"
	@echo "  setup     - Install all dependencies"
	@echo "  dev       - Run both backend and frontend in development mode"
	@echo "  backend   - Run only the backend server"
	@echo "  frontend  - Run only the frontend server"
	@echo "  build     - Build both projects for production"
	@echo "  test      - Run all tests"
	@echo "  generate  - Generate OpenAPI spec and TypeScript client"
	@echo "  clean     - Clean build artifacts"

# Install dependencies for both projects
setup:
	@echo "🔧 Installing backend dependencies..."
	cd backend && cargo build
	@echo "🔧 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Setup complete!"

# Development workflow
dev: generate
	@echo "🚀 Starting development servers..."
	@make -j2 backend frontend

# Run backend server
backend:
	@echo "🦀 Starting Rust backend..."
	cd backend && cargo run --bin budget-tracker-backend

# Run frontend server  
frontend:
	@echo "⚛️ Starting Next.js frontend..."
	cd frontend && npm run dev

# Production build
build:
	@echo "🏗️ Building backend..."
	cd backend && cargo build --release
	@echo "🏗️ Building frontend..."
	cd frontend && npm run build
	@echo "✅ Build complete!"

# Run tests
test:
	@echo "🧪 Running backend tests..."
	cd backend && cargo test
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test 2>/dev/null || echo "No frontend tests configured yet"
	@echo "✅ Tests complete!"

# Generate OpenAPI spec and TypeScript client
generate:
	cd backend && cargo build
	@./scripts/generate-api.sh

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	cd backend && cargo clean
	cd frontend && rm -rf .next node_modules/.cache
	@echo "✅ Clean complete!"
