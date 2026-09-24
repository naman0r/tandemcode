# Everyday commands. `make` alone lists them.
BACKEND := apps/backend
WEB := apps/web
COMPOSE := docker compose -f $(BACKEND)/docker-compose.yml

.DEFAULT_GOAL := help
.PHONY: help setup up down logs web test lint check smoke

help: ## List the commands
	@grep -E '^[a-z]+:.*## ' $(MAKEFILE_LIST) | awk -F ':.*## ' '{ printf "  make %-7s %s\n", $$1, $$2 }'

setup: ## Copy the env templates and install web dependencies
	@test -f $(BACKEND)/.env || cp $(BACKEND)/.env.example $(BACKEND)/.env
	@test -f $(WEB)/.env || cp $(WEB)/.env.example $(WEB)/.env
	cd $(WEB) && npm install
	@echo "Now fill in DB_PASSWORD and the Clerk keys in $(BACKEND)/.env and $(WEB)/.env"

up: ## Start Postgres, the API and the runner
	$(COMPOSE) up -d --build

down: ## Stop them
	$(COMPOSE) down

logs: ## Follow the API and runner logs
	$(COMPOSE) logs -f backend runner

web: ## Run the web app at http://localhost:5173
	cd $(WEB) && npm run dev

test: ## Backend tests, in the API image against the compose database
	$(COMPOSE) up -d db
	$(COMPOSE) run --rm -v "$(CURDIR)/$(BACKEND):/workspace" backend sh -lc 'cd /workspace && HOME=/tmp pip install -q -r requirements-dev.txt && HOME=/tmp python -m pytest'

lint: ## Web lint and production build
	cd $(WEB) && npm run lint && npm run build

check: test lint ## Everything CI runs

smoke: ## Check a deployment: make smoke [SITE=...] [API=...]
	./infra/smoke.sh $(or $(SITE),https://tandemcode.space) $(or $(API),https://api.tandemcode.space)
