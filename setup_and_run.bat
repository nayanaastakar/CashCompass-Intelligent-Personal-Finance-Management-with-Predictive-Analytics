@echo off
rem -------------------------------------------------
rem FinGuard - One-click dev environment setup
rem -------------------------------------------------

rem 1. Open VS Code at the project root
code "%~dp0"

rem 2. Start backend (Spring Boot) in its own window
start "FinGuard Backend" cmd /k "cd /d %~dp0backend && .\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run"

rem Give backend a few seconds to initialise
timeout /t 5 > nul

rem 3. Start frontend (React/Vite) in its own window
start "FinGuard Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

echo.
echo === FinGuard development environment launched ===
echo.
echo • Backend:   http://localhost:8080
echo • Frontend:  http://localhost:3001
echo.
echo Press any key to close this helper window...
pause > nul
