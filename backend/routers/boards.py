from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import Board, User
from schemas import BoardCreate, BoardResponse
from typing import List
from routers.auth import get_current_user

router = APIRouter(
    prefix="/boards",
    tags=["Boards"]
)

# создать доску для текущего пользователя
@router.post("", response_model=BoardResponse)
def create_board(
    board: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_board = Board(title=board.title, user_id=current_user.id)
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    return db_board

# получить конкретную доску по id
@router.get("/{board_id}", response_model=BoardResponse)
def get_board(board_id: int, db: Session = Depends(get_db)):
    stmt = select(Board).where(Board.id == board_id)
    db_board = db.scalars(stmt).one_or_none()
    if not db_board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    return db_board

# получить все доски текущего пользователя
@router.get("/", response_model=List[BoardResponse])
def get_boards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stmt = select(Board).where(Board.user_id == current_user.id)
    return db.scalars(stmt).all()