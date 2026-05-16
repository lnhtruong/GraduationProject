SHELL := powershell.exe
.SHELLFLAGS := -NoProfile -ExecutionPolicy Bypass -Command

.PHONY: help build-backend install-build-backend build build-service install-build migrate migrate-rollback migrate-status migrate-list migrate-railway

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

build-backend:
	@$$ErrorActionPreference = 'Stop'; Get-ChildItem -Path 'backend_services' -Directory | ForEach-Object { $$pkg = Join-Path $$_.FullName 'package.json'; if (Test-Path $$pkg) { Write-Host "==> $$($$_.FullName)"; $$pkgJson = Get-Content $$pkg -Raw; if ($$pkgJson -match '"build"\s*:') { Push-Location $$_.FullName; yarn build; Pop-Location; } else { Write-Host "Skip $$($$_.Name): no build script"; } } }

install-build:
	@$$ErrorActionPreference = 'Stop'; Get-ChildItem -Path 'backend_services' -Directory | ForEach-Object { $$pkg = Join-Path $$_.FullName 'package.json'; if (Test-Path $$pkg) { Write-Host "==> $$($$_.FullName)"; Push-Location $$_.FullName; yarn install; yarn build; Pop-Location; } }

build:
	@$$ErrorActionPreference = 'Stop'; if ("$(SERVICE)" -eq "") { Write-Error 'Usage: make build SERVICE=<service_name>'; exit 1 }; $$servicePath = Join-Path 'backend_services' '$(SERVICE)'; $$pkg = Join-Path $$servicePath 'package.json'; if (-not (Test-Path $$pkg)) { Write-Error "Service not found: $$servicePath"; exit 1 }; $$pkgJson = Get-Content $$pkg -Raw; if ($$pkgJson -notmatch '"build"\s*:') { Write-Error "Service $(SERVICE) has no build script"; exit 1 }; Push-Location $$servicePath; yarn build; Pop-Location

build-service:
	@$(MAKE) build SERVICE=$(SERVICE)

migrate:
	@$$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:latest --env development; Pop-Location

migrate-rollback:
	@$$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:rollback --env development; Pop-Location

migrate-status:
	@$$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:currentVersion --env development; Pop-Location

migrate-list:
	@$$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:list --env development; Pop-Location

migrate-railway:
	@$$ErrorActionPreference = 'Stop'; Push-Location 'database'; npx knex migrate:latest --env railway; Pop-Location