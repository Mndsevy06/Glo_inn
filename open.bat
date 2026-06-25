@echo off
title Pressing Gloria Inn — Demarrage
color 0A

echo.
echo  ============================================================
echo    PRESSING GLORIA INN — Demarrage de l'application
echo  ============================================================
echo.
echo  [1/2] Demarrage du Backend (API + Base de donnees)...
start "Gloria Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 3 /nobreak >nul

echo  [2/2] Demarrage du Frontend (Interface web)...
start "Gloria Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --force"

timeout /t 4 /nobreak >nul

echo.
echo  ============================================================
echo    Application demarree avec succes !
echo.
echo    Backend API  : http://localhost:5000
echo    Frontend App : http://localhost:5173
echo  ============================================================
echo.
echo  Ouverture du navigateur...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo  Vous pouvez fermer cette fenetre.
pause
