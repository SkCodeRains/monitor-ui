@echo off
setlocal enabledelayedexpansion

:: Change directory to the root of the project where this script resides
cd /d "%~dp0"

echo ========================================
echo  Cleaning Output Directories
echo ========================================
echo.

:: Delete dist and docs folders if they exist
if exist "%~dp0dist" (
    echo Deleting existing dist directory...
    rmdir /s /q "%~dp0dist"
)

if exist "%~dp0docs" (
    echo Deleting existing docs directory...
    rmdir /s /q "%~dp0docs"
)

echo.
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

echo Creating fresh docs directory...
mkdir "!TARGET_DIR!"

echo Copying browser build files from !SOURCE_DIR! to !TARGET_DIR!...
xcopy /E /I /H /Y "!SOURCE_DIR!\*" "!TARGET_DIR!\" > nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to copy files to "!TARGET_DIR!".
    exit /b %ERRORLEVEL%
)

:: Copy index.html to 404.html to support SPA routing (e.g. on GitHub Pages)
if exist "!TARGET_DIR!\index.html" (
    copy /Y "!TARGET_DIR!\index.html" "!TARGET_DIR!\404.html" > nul
)

echo.
echo ========================================
echo  Committing docs to Git
echo ========================================
echo.

:: Get current date and time
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm:ss'"') do set "BUILD_DATETIME=%%i"

:: Stage all changes from docs
git add docs

:: Commit changes if any staged
git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    git commit -m "build: !BUILD_DATETIME!"
    echo Committed docs changes with message: "build: !BUILD_DATETIME!"
) else (
    echo No changes in docs to commit.
)

echo.
echo ========================================
echo  Pushing to Remote Repository
echo ========================================
echo.

git push
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Git push failed. Please check your network or repository permissions.
) else (
    echo Successfully pushed to remote!
)

echo.
echo ========================================
echo  Build, Copy, Commit and Push Completed!
echo ========================================
echo Output files are ready in: !TARGET_DIR!
echo.

endlocal
exit /b 0
