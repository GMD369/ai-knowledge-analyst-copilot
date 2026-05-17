from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.core.supabase import get_supabase

bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(bearer),
) -> dict:
    token = credentials.credentials
    supabase = get_supabase()
    try:
        response = supabase.auth.get_user(token)
        if response.user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"id": response.user.id, "email": response.user.email}
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
