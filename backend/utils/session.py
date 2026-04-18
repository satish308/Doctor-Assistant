import time
import uuid
from typing import Dict, List

MAX_HISTORY = 20
SESSION_TTL = 1800

class Session:
    def __init__(self):
        self.history: List[dict] = []
        self.created_at: float = time.time()
        self.last_used: float = time.time()

    def is_expired(self) -> bool:
        return (time.time() - self.last_used) > SESSION_TTL

class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, Session] = {}

    def create_session(self) -> str:
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = Session()
        return session_id

    def get_session(self, session_id: str) -> Session:
        session = self._sessions.get(session_id)
        if not session or session.is_expired():
            return None
        return session

    def clear_session(self, session_id: str):
        self._sessions.pop(session_id, None)

session_manager = SessionManager()
