FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/WinCraft.API/WinCraft.API.csproj", "src/WinCraft.API/"]
COPY ["src/WinCraft.Application/WinCraft.Application.csproj", "src/WinCraft.Application/"]
COPY ["src/WinCraft.Domain/WinCraft.Domain.csproj", "src/WinCraft.Domain/"]
COPY ["src/WinCraft.Infrastructure/WinCraft.Infrastructure.csproj", "src/WinCraft.Infrastructure/"]
COPY ["src/WinCraft.Shared/WinCraft.Shared.csproj", "src/WinCraft.Shared/"]
RUN dotnet restore "src/WinCraft.API/WinCraft.API.csproj"
COPY . .
WORKDIR "/src/src/WinCraft.API"
RUN dotnet build "WinCraft.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "WinCraft.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WinCraft.API.dll"]
