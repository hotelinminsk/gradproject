# Makefile for Entity Framework Core commands
PROJECT := GtuAttendance.Infrastructure
STARTUP := GtuAttendance.Api
MIGRATION ?=        # pass with `make add-migration MIGRATION=Foo`

guard-%:
	@if [ -z "${${*}}" ]; then echo "Missing $* (e.g. make add-migration MIGRATION=Foo)"; exit 1; fi

add-migration: guard-MIGRATION
	dotnet ef migrations add $(MIGRATION) --project $(PROJECT) --startup-project $(STARTUP)

update-db:
	dotnet ef database update --project $(PROJECT) --startup-project $(STARTUP)

remove-migration:
	dotnet ef migrations remove --project $(PROJECT) --startup-project $(STARTUP)


run-https:
	dotnet run --project $(STARTUP) --launch-profile https
run-http:
	dotnet run --project $(STARTUP) --launch-profile http

