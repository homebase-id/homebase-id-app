@echo off
setlocal enabledelayedexpansion

set ROOT_DIR=%CD%
set ANDROID_DIR=%ROOT_DIR%\packages\mobile\android

echo Cleaning project directories...

if exist "%ROOT_DIR%\node_modules" (
    echo Deleting node_modules...
    rd /s /q "%ROOT_DIR%\node_modules"
)

if exist "%ROOT_DIR%\package-lock.json" (
    echo Deleting package-lock.json...
    del /q "%ROOT_DIR%\package-lock.json"
)

echo Clearing npm cache...
call npm cache clean --force

if exist "%ANDROID_DIR%\.gradle" (
    echo Deleting .gradle...
    rd /s /q "%ANDROID_DIR%\.gradle"
)

echo More Gradle clean...
rd /s /q "%USERPROFILE%\.gradle\caches\build-cache-1"


if exist "%ANDROID_DIR%\build" (
    echo Deleting android/build...
    rd /s /q "%ANDROID_DIR%\build"
)

if exist "%ANDROID_DIR%\.idea" (
    echo Deleting android/.idea...
    rd /s /q "%ANDROID_DIR%\.idea"
)

if exist "%ANDROID_DIR%\app\build" (
    echo Deleting android/app/build...
    rd /s /q "%ANDROID_DIR%\app\build"
)

echo Deleting Metro and Haste temp caches...
for /d %%i in ("%TEMP%\metro-bundler-cache-*") do rd /s /q "%%i" 2>nul
for /d %%i in ("%TEMP%\haste-map-react-native-packager-*") do rd /s /q "%%i" 2>nul
for /d %%i in ("%TEMP%\react-native-packager-cache-*") do rd /s /q "%%i" 2>nul
echo Clean complete.
