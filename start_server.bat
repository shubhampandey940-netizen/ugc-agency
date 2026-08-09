@echo off
title AI Studio Dev Server
echo Starting local web server via PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_server.ps1"
pause
