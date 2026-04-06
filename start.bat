@echo off
title ATPSOR - Platforma Transport Ocazional
echo.
echo  ========================================
echo   ATPSOR - Transport Ocazional
echo   Platforma demonstrativa
echo  ========================================
echo.
echo  Pornire server...
echo.
echo  Dupa pornire, deschide in browser:
echo  http://localhost:3001
echo.
echo  Pentru oprire: CTRL+C sau inchide fereastra
echo  ========================================
echo.

cd /d "%~dp0"
npx next start -p 3001
pause
