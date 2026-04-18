import logging
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import get_settings
from routes import voice_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("=" * 50)
    logger.info("  Dr. Satish — AI Voice Doctor Assistant")
    logger.info(f"  Whisper model  : {settings.whisper_model}")
    logger.info(f"  CSM device     : {settings.csm_device}")
    logger.info(f"  AI model       : Claude Haiku")
    logger.info("=" * 50)
    yield
    logger.info("Server shutting down.")

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Dr. Satish — AI Voice Doctor Assistant",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(voice_router)

    @app.get("/health", tags=["meta"])
    async def health():
        return {"status": "ok", "service": "Dr. Satish Voice Assistant"}

    @app.exception_handler(Exception)
    async def global_error_handler(request, exc):
        logger.error(f"Unhandled error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Something went wrong. Please try again."},
        )

    return app

app = create_app()

if __name__ == "__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level="info",
    )