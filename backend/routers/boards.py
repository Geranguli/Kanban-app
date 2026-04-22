"""
CRUD-операции для досок.
Каждая доска привязана к пользователю (user_id);
используется каскадное удаление: при удалении пользователя 
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from database import get_db
from models import Board, User
from schemas import BoardCreate, BoardUpdate, BoardResponse
from typing import List
from routers.auth import get_current_user

router = APIRouter(
    prefix="/boards",
    tags=["Boards"]
)
    
"""
создает новую доску для пользователя;
автоматически подставляет user_id из current_user, игнорируя 
любое переданное значение в теле запроса - это защита от 
создания досок от чужого имени
"""
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


@router.get("/{board_id}", response_model=BoardResponse)
def get_board(board_id: int, db: Session = Depends(get_db)):
    #получает доску по id без проверки владельца
    stmt = select(Board).where(Board.id == board_id)
    db_board = db.scalars(stmt).one_or_none()
    
    if not db_board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    return db_board

"""
возвращает все доски текущего пользователя;
используется на главной странице после авторизации
"""
@router.get("/", response_model=List[BoardResponse])
def get_boards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stmt = select(Board).where(Board.user_id == current_user.id)
    return db.scalars(stmt).all()

"""
обновление доски;
проверяет каждое поле на none - позволяет обновлять 
только переданные поля, не трогая остальные
"""
@router.put("/{board_id}", response_model=BoardResponse)
def update_board(
    board_id: int,
    board_update: BoardUpdate,
    db: Session = Depends(get_db)
):
    stmt = select(Board).where(Board.id == board_id)
    db_board = db.scalars(stmt).first()
    
    if not db_board:
        raise HTTPException(status_code=404, detail="Доска не найдена")

    # обновление: только если поле явно передано
    if board_update.title is not None:
        db_board.title = board_update.title

    db.commit()
    db.refresh(db_board)
    return db_board

"""
удаляет конкретную доску со всеми колонками и карточками;
каскадное удаление работает на уровне БД (ON DELETE CASCADE) 
и (cascade в relationship)
"""
@router.delete("/{board_id}")
def delete_board(board_id: int, db: Session = Depends(get_db)):
    stmt = select(Board).where(Board.id == board_id)
    db_board = db.scalars(stmt).first()
    
    if not db_board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    db.delete(db_board)
    db.commit()
    return {"message": "Доска удалена"}

"""
Массовое удаление всех досок пользователя;
использует SQL-оператор delete с фильтром вместе с ORM-удалением
"""
@router.delete("/")
def delete_boards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    boards_stmt = delete(Board).where(Board.user_id == current_user.id)
    db.execute(boards_stmt)
    db.commit()
    return {"message": "Доски удалены"}