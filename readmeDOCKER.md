GTU Attendance API — Docker (HTTPS Only)

Overview
- Runs the .NET 8 API in a container over HTTPS only.
- Reuses your existing SQL Server compose (docker/docker-compose.dev.yml) and adds an api service.
- WebAuthn requires consistent HTTPS origin. We standardize on https://localhost:7270 for dev.

Prerequisites
- .NET SDK installed (for dev certificate export)
- Docker Desktop
- Trusted local HTTPS dev certificate

Export and trust dev HTTPS certificate (Windows/PowerShell)
- dotnet dev-certs https -ep "$env:USERPROFILE\.aspnet\https\aspnetapp.pfx" -p MyDevPass!
- dotnet dev-certs https --trust

Compose file used
- docker/docker-compose.dev.yml
  - sqlserver service (your existing one)
  - api service (added) builds from backend/GtuAttendance.Api/Dockerfile

How to run
- cd docker
- docker compose -f docker-compose.dev.yml up --build
- API: https://localhost:7270 (HTTPS only)
- SQL Server: localhost:1433 (from host), service name sqlserver inside the network

Environment details (api service)
- ASPNETCORE_URLS=https://+:8443 (container listens on HTTPS only)
- Port mapping: 7270 (host) -> 8443 (container)
- Dev cert mounted from %USERPROFILE%\.aspnet\https to /https (read-only)
- Kestrel default cert path: /https/aspnetapp.pfx
- Kestrel default cert password: MyDevPass! (matches export above)
- Connection string: Server=sqlserver,1433;Database=GtuAttendanceDb;User Id=sa;Password=HabilKalkan!34!Gtu;TrustServerCertificate=True;
- Fido2 Origin: https://localhost:7270 (must match browser origin exactly)

WebAuthn dev notes
- Origin must equal the exact scheme+host+port of the page making the WebAuthn call.
- Use the same origin for Swagger/test page and API: https://localhost:7270
- After changing Origin or port, restart compose and re-run the begin step.

Project structure in Docker build
- backend/GtuAttendance.Api/Dockerfile builds the API and its referenced projects (.Infrastructure, .Core) via project references.
- .dockerignore excludes bin/obj, .git, node_modules, etc.

Useful endpoints
- Swagger: https://localhost:7270/swagger
- Health: https://localhost:7270/health, /health/ready, /health/live
- Static test page: https://localhost:7270/webauthn-test.html

HTTPS enforcement
- Program.cs enforces HTTPS via RequireHttps, HttpsRedirection (port from ASPNETCORE_HTTPS_PORT), and HSTS in non-development.
- The container exposes only HTTPS; HTTP is not bound.

Troubleshooting
- Browser shows security errors
  - Ensure the dev certificate is trusted (dotnet dev-certs https --trust)
  - Confirm you are using https://localhost:7270 (not http)
- WebAuthn origin mismatch
  - Confirm readme’s Origin and the page origin match exactly (scheme, host, and port)
  - Ensure Fido2:Origin config is https://localhost:7270
- SQL connection issues
  - Ensure both services are on the same Docker network (gtu-network)
  - Inside the network, Server=sqlserver,1433; From host tools, use localhost,1433
- Cert volume mapping fails
  - Verify %USERPROFILE%\.aspnet\https contains aspnetapp.pfx
  - Ensure the path is quoted in YAML and backslashes are escaped

Common commands
- Rebuild after code changes: docker compose -f docker/docker-compose.dev.yml up --build --force-recreate
- Stop: docker compose -f docker/docker-compose.dev.yml down
- View logs: docker compose -f docker/docker-compose.dev.yml logs -f api

