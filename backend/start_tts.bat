@echo off
title Microservicio Sofi Neural TTS (Edge-TTS)
echo ========================================================
echo   Iniciando Microservicio de Voz Neuronal para Sofi
echo ========================================================
python -m uvicorn backend.tts_service:app --host 0.0.0.0 --port 8000 --reload
pause
