@echo off
rem Startet das Spiel oertlich und oeffnet den Browser.
rem Einfach doppelklicken. Zum Beenden dieses Fenster schliessen.

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Node.js wurde nicht gefunden.
  echo   Es wird gebraucht, um das Spiel oertlich auszuliefern.
  echo   Herunterladen: https://nodejs.org
  echo.
  pause
  exit /b 1
)

start "" http://127.0.0.1:4200/
node werkzeuge/vorschau-server.mjs
