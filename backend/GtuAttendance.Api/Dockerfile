## GTU Attendance API - Dockerfile (HTTPS only)

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy entire repo (simple caching for monorepo)
COPY . .

# Restore, build, and publish API project
WORKDIR /src/backend/GtuAttendance.Api
RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish -p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# HTTPS port inside container
EXPOSE 8443

# Copy published output
COPY --from=build /app/publish .

# App will take Kestrel cert path/password from env
# and listen only on HTTPS (ASPNETCORE_URLS)
ENTRYPOINT ["dotnet", "GtuAttendance.Api.dll"]
