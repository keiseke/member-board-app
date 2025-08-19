@echo off
echo Starting cleanup...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json
if exist .next rmdir /s /q .next
echo Cleanup completed.
echo Installing minimal dependencies...
npm install next@15.4.4 react@19.1.0 react-dom@19.1.0 typescript@^5
echo Installation completed.