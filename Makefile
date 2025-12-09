.PHONY: dev preview prebuild build

dev: build
	pnpm dev

preview: build
	pnpm preview

prebuild:
	pnpm prebuild

build: prebuild
	pnpm db:generate
	pnpm db:push
	pnpm build

docker:
	docker compose -f docker-compose.yml up --build