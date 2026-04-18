from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.voice import router as voice_router

app = FastAPI(title="AI Doctor Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router, prefix="/api/voice", tags=["Voice"])

@app.get("/")
def read_root():
    return {"message": "AI Doctor Assistant is running!"}