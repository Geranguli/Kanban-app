from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
def login(username: str):
    return {"id": 1, "username": username}