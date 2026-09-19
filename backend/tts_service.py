"""
Microservicio Local de Síntesis de Voz Neuronal con Edge-TTS
Plataforma: Ecosistema Phygital Inclusivo Tech-and-Touch
Voz por defecto: es-CO-SalomeNeural (Acento colombiano cálido, empático y preoperatorio)
"""

import sys
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
import edge_tts
import uvicorn

app = FastAPI(
    title="Sofi Voice TTS Service",
    description="Microservicio local de voz neuronal hiperrealista para el asistente preoperatorio Sofi",
    version="1.0.0"
)

# Configuración de CORS permisivo para Vite y consumo local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VOZ_DEFAULT = "es-CO-SalomeNeural"
RATE_DEFAULT = "+5%" # Ritmo ágil y natural para mayor fluidez conversacional

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = VOZ_DEFAULT
    rate: Optional[str] = RATE_DEFAULT
    pitch: Optional[str] = "+0Hz"

@app.get("/")
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "edge-tts-sofi",
        "default_voice": VOZ_DEFAULT,
        "recommended_rate": RATE_DEFAULT
    }

@app.get("/api/voices")
async def list_recommended_voices():
    """Retorna las voces neuronales en español recomendadas para el entorno clínico."""
    return [
        {"id": "es-CO-SalomeNeural", "name": "Salomé (Colombia - Cálida/Empática)", "recommended": True},
        {"id": "es-MX-DaliaNeural", "name": "Dalia (México - Suave/Natural)", "recommended": False},
        {"id": "es-ES-ElviraNeural", "name": "Elvira (España - Clara/Profesional)", "recommended": False},
    ]

@app.post("/api/tts")
async def generate_speech(payload: TTSRequest):
    """
    Genera el archivo de audio MP3 a partir del texto suministrado usando Microsoft Edge Neural TTS.
    """
    clean_text = payload.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="El campo 'text' no puede estar vacío.")

    voice = payload.voice or VOZ_DEFAULT
    rate = payload.rate or RATE_DEFAULT
    pitch = payload.pitch or "+0Hz"

    try:
        communicate = edge_tts.Communicate(
            text=clean_text,
            voice=voice,
            rate=rate,
            pitch=pitch
        )

        audio_chunks = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_chunks.append(chunk["data"])

        if not audio_chunks:
            raise HTTPException(status_code=500, detail="No se generaron datos de audio desde edge-tts.")

        audio_bytes = b"".join(audio_chunks)

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=sofi_speech.mp3",
                "Cache-Control": "no-cache",
                "X-TTS-Voice": voice,
                "X-TTS-Rate": rate,
            }
        )

    except Exception as e:
        print(f"[TTS-Error] Falla al sintetizar voz: {e}", file=sys.stderr)
        raise HTTPException(
            status_code=500,
            detail=f"Error interno en síntesis neuronal: {str(e)}"
        )

if __name__ == "__main__":
    print(f"==================================================")
    print(f"  Iniciando Microservicio Sofi Neural TTS (FastAPI)")
    print(f"  Voz predeterminada: {VOZ_DEFAULT}")
    print(f"  Endpoint: http://localhost:8000/api/tts")
    print(f"  Salud:    http://localhost:8000/api/health")
    print(f"==================================================")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
