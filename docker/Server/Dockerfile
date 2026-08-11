# Production/UAT Dockerfile for .NET 10
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["pramukhraj-foods-server/pramukhraj.csproj", "./"]
RUN dotnet restore "pramukhraj-foods-server/pramukhraj.csproj"
COPY . .
RUN dotnet build "pramukhraj-foods-server/pramukhraj.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "pramukhraj-foods-server/pramukhraj.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "pramukhraj-foods-server/pramukhraj.dll"]