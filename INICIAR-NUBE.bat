@echo off
REM ASCENDX AI - abre la app conectada al servidor en la nube (no inicia la API local).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\iniciar-nube.ps1"
pause
