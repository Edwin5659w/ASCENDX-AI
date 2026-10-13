@echo off
REM ASCENDX AI - detiene la base de datos local.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\detener.ps1"
pause
