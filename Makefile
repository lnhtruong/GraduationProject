ifeq ($(OS),Windows_NT)
SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command
BUILD_BACKEND_CMD = $$ErrorActionPreference = 'Stop'; Get-ChildItem -Path 'backend_services' -Directory | ForEach-Object { $$pkg = Join-Path $$_.FullName 'package.json'; if (Test-Path $$pkg) { Write-Host "==> $$($$_.FullName)"; $$pkgJson = Get-Content $$pkg -Raw; if ($$pkgJson -match '"build"\s*:') { Push-Location $$_.FullName; yarn build; Pop-Location; } else { Write-Host "Skip $$($$_.Name): no build script"; } } }
INSTALL_BUILD_CMD = $$ErrorActionPreference = 'Stop'; Get-ChildItem -Path 'backend_services' -Directory | ForEach-Object { $$pkg = Join-Path $$_.FullName 'package.json'; if (Test-Path $$pkg) { Write-Host "==> $$($$_.FullName)"; $$pkgJson = Get-Content $$pkg -Raw; Push-Location $$_.FullName; yarn install; if ($$pkgJson -match '"build"\s*:') { yarn build; } else { Write-Host "Skip $$($$_.Name): no build script"; } Pop-Location; } }
BUILD_CMD = $$ErrorActionPreference = 'Stop'; if ("$(SERVICE)" -eq "") { Write-Error 'Usage: make build SERVICE=<service_name>'; exit 1 }; $$servicePath = Join-Path 'backend_services' '$(SERVICE)'; $$pkg = Join-Path $$servicePath 'package.json'; if (-not (Test-Path $$pkg)) { Write-Error "Service not found: $$servicePath"; exit 1 }; $$pkgJson = Get-Content $$pkg -Raw; if ($$pkgJson -notmatch '"build"\s*:') { Write-Error "Service $(SERVICE) has no build script"; exit 1 }; Push-Location $$servicePath; yarn build; Pop-Location
MIGRATE_CMD = $$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:latest --env development; Pop-Location
MIGRATE_ROLLBACK_CMD = $$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:rollback --env development; Pop-Location
MIGRATE_STATUS_CMD = $$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:currentVersion --env development; Pop-Location
MIGRATE_LIST_CMD = $$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:list --env development; Pop-Location
MIGRATE_RAILWAY_CMD = $$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:latest --env railway; Pop-Location
SEED_CMD = $$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex seed:run --env development; Pop-Location
SEED_RAILWAY_CMD = $$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex seed:run --env railway; Pop-Location
else
SHELL := /bin/bash
.SHELLFLAGS := -e -o pipefail -c
BUILD_BACKEND_CMD = set -e; for d in backend_services/*; do if [ -d "$$d" ] && [ -f "$$d/package.json" ]; then echo "==> $$d"; if grep -q '"build"' "$$d/package.json"; then (cd "$$d" && yarn build); else echo "Skip $$(basename "$$d"): no build script"; fi; fi; done
INSTALL_BUILD_CMD = set -e; for d in backend_services/*; do if [ -d "$$d" ] && [ -f "$$d/package.json" ]; then echo "==> $$d"; (cd "$$d" && yarn install); if grep -q '"build"' "$$d/package.json"; then (cd "$$d" && yarn build); else echo "Skip $$(basename "$$d"): no build script"; fi; fi; done
BUILD_CMD = set -e; if [ -z "$(SERVICE)" ]; then echo "Usage: make build SERVICE=<service_name>" >&2; exit 1; fi; servicePath="backend_services/$(SERVICE)"; pkg="$$servicePath/package.json"; if [ ! -f "$$pkg" ]; then echo "Service not found: $$servicePath" >&2; exit 1; fi; if ! grep -q '"build"' "$$pkg"; then echo "Service $(SERVICE) has no build script" >&2; exit 1; fi; (cd "$$servicePath" && yarn build)
MIGRATE_CMD = set -e; cd database; npx knex migrate:latest --env development
MIGRATE_ROLLBACK_CMD = set -e; cd database; npx knex migrate:rollback --env development
MIGRATE_STATUS_CMD = set -e; cd database; npx knex migrate:currentVersion --env development
MIGRATE_LIST_CMD = set -e; cd database; npx knex migrate:list --env development
MIGRATE_RAILWAY_CMD = set -e; cd database; npx knex migrate:latest --env railway
SEED_CMD = set -e; cd database; npx knex seed:run --env development
SEED_RAILWAY_CMD = set -e; cd database; npx knex seed:run --env railway
endif

.PHONY: help build-backend install-build-backend build build-service install-build migrate migrate-rollback migrate-status migrate-list migrate-railway seed seed-railway

help:
	@echo "Targets:"
	@echo "  make build-backend             Build all services under backend_services with yarn build"
	@echo "  make install-build             Run yarn install and yarn build for all services"
	@echo "  make build SERVICE=...         Build one service under backend_services"
	@echo "  make build-service SERVICE=... Alias of make build"
	@echo "  make migrate                   Run database migration latest"
	@echo "  make migrate-rollback          Roll back one database migration"
	@echo "  make migrate-status            Show current migration version"
	@echo "  make migrate-list              List database migrations"
	@echo "  make migrate-railway           Run database migration latest for railway env"
	@echo "  make seed                      Run database/seeds/*.js (loads seed_data.sql) for dev env"
	@echo "  make seed-railway              Same as 'make seed' but against railway env"

build-backend:
	@$(BUILD_BACKEND_CMD)

install-build:
	@$(INSTALL_BUILD_CMD)

build:
	@$(BUILD_CMD)

build-service:
	@$(MAKE) build SERVICE=$(SERVICE)

migrate:
	@$(MIGRATE_CMD)

migrate-rollback:
	@$(MIGRATE_ROLLBACK_CMD)

migrate-status:
	@$(MIGRATE_STATUS_CMD)

migrate-list:
	@$(MIGRATE_LIST_CMD)

migrate-railway:
	@$(MIGRATE_RAILWAY_CMD)

seed:
	@$(SEED_CMD)

seed-railway:
	@$(SEED_RAILWAY_CMD)