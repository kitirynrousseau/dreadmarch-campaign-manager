from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Dreadmarch Campaign Manager API")

# Allow frontend to talk to backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test endpoint
@app.get("/")
def read_root():
    return {"message": "Dreadmarch Campaign Manager API is running"}

# Character list endpoint (mock data for now)
@app.get("/api/characters")
def get_characters():
    return {
        "characters": [
            {
                "id": 1,
                "name": "Darth Imperius",
                "faction": "Sith Inquisition",
                "owner":  "player1"
            },
            {
                "id": 2,
                "name": "Agent Cipher Nine",
                "faction": "Sith Intelligence",
                "owner": "player2"
            }
        ]
    }