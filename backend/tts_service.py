"""
Microservicio Local de Síntesis de Voz Neuronal con Edge-TTS
Plataforma: Ecosistema Phygital Inclusivo PreCare
Voz por defecto: es-CO-SalomeNeural (Acento colombiano cálido, empático y preoperatorio)
"""

import sys
import asyncio
from collections import OrderedDict
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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "*"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

VOZ_DEFAULT = "es-CO-SalomeNeural"
RATE_DEFAULT = "+12%" # Ritmo cálido, natural y claro para llamadas preoperatorias
TTS_CACHE_MAX_SIZE = 80
TTS_CACHE: "OrderedDict[tuple[str, str, str, str], bytes]" = OrderedDict()

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

async def _synthesize_edge_tts(text: str, voice: str, rate: str, pitch: str) -> bytes:
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice,
        rate=rate,
        pitch=pitch
    )
    audio_chunks = []
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])
    return b"".join(audio_chunks)

@app.post("/api/tts")
async def generate_speech(payload: TTSRequest):
    """
    Genera el archivo de audio MP3 a partir del texto suministrado usando Microsoft Edge Neural TTS.
    Incluye caché LRU en memoria y reintento automático para máxima estabilidad.
    """
    clean_text = payload.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="El campo 'text' no puede estar vacío.")

    voice = payload.voice or VOZ_DEFAULT
    rate = payload.rate or RATE_DEFAULT
    pitch = payload.pitch or "+0Hz"

    cache_key = (clean_text, voice, rate, pitch)
    if cache_key in TTS_CACHE:
        TTS_CACHE.move_to_end(cache_key)
        return Response(
            content=TTS_CACHE[cache_key],
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=sofi_speech.mp3",
                "Cache-Control": "no-cache",
                "X-TTS-Voice": voice,
                "X-TTS-Rate": rate,
                "X-TTS-Cache": "HIT",
            }
        )

    last_err = None
    for attempt in range(2):
        try:
            audio_bytes = await _synthesize_edge_tts(clean_text, voice, rate, pitch)
            if audio_bytes:
                TTS_CACHE[cache_key] = audio_bytes
                if len(TTS_CACHE) > TTS_CACHE_MAX_SIZE:
                    TTS_CACHE.popitem(last=False)

                return Response(
                    content=audio_bytes,
                    media_type="audio/mpeg",
                    headers={
                        "Content-Disposition": "inline; filename=sofi_speech.mp3",
                        "Cache-Control": "no-cache",
                        "X-TTS-Voice": voice,
                        "X-TTS-Rate": rate,
                        "X-TTS-Cache": "MISS",
                    }
                )
            last_err = RuntimeError("No se generaron datos de audio desde edge-tts.")
        except Exception as e:
            last_err = e
            if attempt == 0:
                await asyncio.sleep(0.25)

    print(f"[TTS-Error] Falla al sintetizar voz tras reintento: {last_err}", file=sys.stderr)
    raise HTTPException(
        status_code=500,
        detail=f"Error interno en síntesis neuronal: {str(last_err)}"
    )

if __name__ == "__main__":
    print(f"==================================================")
    print(f"  Iniciando Microservicio Sofi Neural TTS (FastAPI)")
    print(f"  Voz predeterminada: {VOZ_DEFAULT}")
    print(f"  Endpoint: http://localhost:8000/api/tts")
    print(f"  Salud:    http://localhost:8000/api/health")
    print(f"==================================================")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
