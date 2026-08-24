@echo off
setlocal enabledelayedexpansion

:: Change directory to the root of the project where this script resides
cd /d "%~dp0"

echo ========================================
echo  Building Angular Application
echo ========================================
echo.

:: Run Angular Production Build
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Angular build failed with error code %ERRORLEVEL%.
    exit /b %ERRORLEVEL%
)

set "SOURCE_DIR=%~dp0dist\monitor-ui\browser"
set "TARGET_DIR=%~dp0docs"

echo.
echo ========================================
echo  Deploying Browser Output to /docs
echo ========================================
echo.

if not exist "!SOURCE_DIR!" (
    echo [ERROR] Source build directory "!SOURCE_DIR!" not found.
    exit /b 1
)

:: Clean existing docs directory if present to remove stale files
if exist "!TARGET_DIR!" (
    echo Cleaning existing docs directory...
    rmdir /s /q "!TARGET_DIR!"
)

echo Creating docs directory...
mkdir "!TARGET_DIR!"

echo Copying browser build files from !SOURCE_DIR! to !TARGET_DIR!...
xcopy /E /I /H /Y "!SOURCE_DIR!\*" "!TARGET_DIR!\" > nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to copy files to "!TARGET_DIR!".
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================
echo  Build and Copy Completed Successfully!
echo ========================================
echo Output files are ready in: !TARGET_DIR!
echo.

endlocal
exit /b 0
