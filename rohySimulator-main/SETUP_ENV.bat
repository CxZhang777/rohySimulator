@echo off
REM VipSim Authentication Setup Script for Windows
REM This script creates the required .env file for the backend

echo.
echo ====================================
echo VipSim Authentication Setup
echo ====================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ERROR: Please run this script from the VipSim root directory
    pause
    exit /b 1
)

REM Create server directory if it doesn't exist
if not exist "server" mkdir server

REM Check if .env already exists
if exist "server\.env" (
    echo WARNING: server\.env already exists!
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo Setup cancelled
        pause
        exit /b 0
    )
)

REM Generate a simple random secret (Windows doesn't have openssl by default)
set JWT_SECRET=vipsim-jwt-secret-%RANDOM%%RANDOM%%RANDOM%-%DATE:~-4%%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%

REM Create .env file
(
echo # JWT Secret Key - Generated: %DATE% %TIME%
echo JWT_SECRET=%JWT_SECRET%
echo.
echo # JWT Token Expiry ^(default: 24 hours^)
echo JWT_EXPIRY=24h
echo.
echo # Server Port
echo PORT=3000
) > server\.env

echo.
echo ====================================
echo Environment file created successfully!
echo ====================================
echo.
echo File: server\.env
echo JWT_SECRET: %JWT_SECRET%
echo.
echo IMPORTANT SECURITY NOTES:
echo   - The .env file is automatically ignored by git
echo   - Keep your JWT_SECRET private
echo   - For production, use a stronger secret
echo.
echo Next steps:
echo   1. Run: npm install
echo   2. Run: npm run dev
echo   3. Open: http://localhost:5173
echo   4. Create your first admin account
echo.
echo See AUTH_SETUP.md for more information
echo.
pause
