.PHONY: dev preview prebuild build

help:
	@echo "Available targets:"
	@awk -F':.*##' '/^[a-zA-Z0-9_-]+:.*##/ { printf "make %-10s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)


docker: ## Start development server with Docker
	docker compose -f docker-compose.yml up --build


install: ## Install dependencies
	pnpm install

dev: install build ## Start development server
	pnpm dev


preview: install build ## Preview preview build
	pnpm preview


build: ## Build steps before production build
	pnpm db:generate
	pnpm db:push
	pnpm build


lint:  ## Run linting and type checking
	pnpm db:generate
	pnpm typecheck

typecheck:  ## Run type checking
	pnpm db:generate
	pnpm typecheck

cli: ## Run the CLI
	pnpm cli