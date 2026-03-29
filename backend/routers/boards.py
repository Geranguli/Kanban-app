from fastapi import APIRouter

router = APIRouter()

@router.get("/boards")
def get_boards():
    return [{"id": 1, "title": "Test"}]