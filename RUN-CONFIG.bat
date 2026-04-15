@echo off
REM Bluehost Reverse Proxy Configuration Launcher
REM This script runs the Python configuration tool

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  Bluehost Reverse Proxy Configuration Launcher             ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Remember to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

REM Check if requests module is available
python -c "import requests" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Installing required Python module (requests)...
    pip install requests
    if errorlevel 1 (
        echo ❌ Failed to install requests module
        pause
        exit /b 1
    )
)

REM Run the configuration script
echo Running configuration script...
echo.
python configure-bluehost-proxy.py

if errorlevel 1 (
    echo.
    echo ❌ Configuration failed. Check the errors above.
) else (
    echo.
    echo ✅ Configuration completed!
)

echo.
pause
