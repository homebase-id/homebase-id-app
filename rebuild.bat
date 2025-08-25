@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%CD%
set ANDROID_DIR=%ROOT_DIR%\packages\mobile\android

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
