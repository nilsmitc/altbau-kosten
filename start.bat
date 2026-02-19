@echo off
chcp 65001 >nul
title Altbau Kosten

cd /d "%~dp0"

echo Altbau Kosten - Starte...
echo.

:: Node.js pruefen
where node >nul 2>&1
if errorlevel 1 (
    echo FEHLER: Node.js ist nicht installiert.
    echo Bitte Node.js von https://nodejs.org herunterladen und installieren.
    echo Empfohlen: LTS-Version ^(z.B. 22.x^)
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo Node.js %NODE_VERSION% gefunden.

:: npm install wenn node_modules fehlt
if not exist "node_modules\" (
    echo node_modules nicht gefunden - fuehre npm install aus...
    echo ^(Nur beim ersten Start noetig, dauert ca. 1-2 Minuten^)
    echo.
    npm install
    if errorlevel 1 (
        echo FEHLER: npm install fehlgeschlagen.
        pause
        exit /b 1
    )
    echo.
)

:: data/-Verzeichnis und JSON-Startdateien anlegen
if not exist "data\" (
    echo Erstelle Datenverzeichnis...
    mkdir data
    mkdir data\belege
    node -e "require('fs').writeFileSync('data/projekt.json', '{\"gewerke\":[],\"raeume\":[],\"budgets\":[],\"planung\":[]}')"
    node -e "require('fs').writeFileSync('data/buchungen.json', '[]')"
    node -e "require('fs').writeFileSync('data/rechnungen.json', '[]')"
    node -e "require('fs').writeFileSync('data/summary.json', '{\"generiert\":null,\"gesamt\":{\"ist\":0,\"budget\":0},\"gewerke\":[],\"raeume\":[],\"letzteBuchungen\":[]}')"
    echo Datenverzeichnis erstellt.
    echo.
)

:: Server starten
echo Server startet unter http://localhost:5173
echo Fenster schliessen beendet den Server.
echo.
npm run dev -- --open
