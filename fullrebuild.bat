@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%CD%
set ANDROID_DIR=%ROOT_DIR%\packages\mobile\android

echo Press any key to clean project directories...
pause

if exist "%ROOT_DIR%\node_modules" (
    echo Deleting node_modules...
    rd /s /q "%ROOT_DIR%\node_modules"
)

if exist "%ROOT_DIR%\package-lock.json" (
    echo Deleting package-lock.json...
    del /q "%ROOT_DIR%\package-lock.json"
)

if exist "%ANDROID_DIR%\.gradle" (
    echo Deleting .gradle...
    rd /s /q "%ANDROID_DIR%\.gradle"
)

if exist "%ANDROID_DIR%\build" (
    echo Deleting android/build...
    rd /s /q "%ANDROID_DIR%\build"
)

if exist "%ANDROID_DIR%\app\build" (
    echo Deleting android/app/build...
    rd /s /q "%ANDROID_DIR%\app\build"
)

echo Clean complete. Press any key to start fresh build...
pause

echo Running fresh build...

echo Installing npm dependencies...
call npm install

echo Building libs...
call npm run build:libs

cd /d "%ANDROID_DIR%"

echo Running Gradle clean and refresh...
call gradlew clean --no-daemon --refresh-dependencies

echo Running Gradle assembleDebug...
call gradlew assembleDebug --no-daemon

cd /d "%ROOT_DIR%"

echo Running npm start
call npm start --reset-cache
