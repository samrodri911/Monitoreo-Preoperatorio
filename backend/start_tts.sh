#!/usr/bin/env bash
echo "========================================================"
echo "  Iniciando Microservicio Sofi Neural TTS (FastAPI)"
echo "  Voz: es-CO-SalomeNeural (Microsoft Edge TTS)"
echo "  Endpoint: http://localhost:8000/api/tts"
echo "========================================================"

# Ubicarse en el directorio raíz del proyecto
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

# Priorizar el entorno virtual de backend/.venv
if [ -f "backend/.venv/bin/python" ]; then
    PY="backend/.venv/bin/python"
elif [ -f ".venv/bin/python" ]; then
    PY=".venv/bin/python"
elif command -v python3 &>/dev/null; then
    PY="python3"
else
    PY="python"
fi

echo "Usando intérprete Python: $PY"
exec "$PY" backend/tts_service.py
