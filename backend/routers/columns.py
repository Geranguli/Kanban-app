from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import select, delete, func
from models import KanbanColumn, Board
from schemas import ColumnCreate, ColumnUpdate, ColumnResponse
from typing import List

router = APIRouter(
    prefix="/columns",
    tags=["Columns"]
)

# создать колонку на доске
@router.post("/", response_model=ColumnResponse)
def create_column(
    column: ColumnCreate,
    board_id: int = Query(...),
    db: Session = Depends(get_db)
):
    stmt = select(Board).where(Board.id == board_id)
    board = db.scalars(stmt).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")
    
    max_pos = db.scalar(
        select(func.max(KanbanColumn.position))
        .where(KanbanColumn.board_id == board_id)
    )
    new_position = 0 if max_pos is None else max_pos + 1

    db_column = KanbanColumn(title=column.title, board_id=board_id, position = new_position)
    db.add(db_column)
    db.commit()
    db.refresh(db_column)
    return db_column

# получить колонку по id
@router.get("/{column_id}", response_model=ColumnResponse)
def get_column(column_id: int, db: Session = Depends(get_db)):
    stmt = select(KanbanColumn).where(KanbanColumn.id == column_id)
    db_column = db.scalars(stmt).first()
    if not db_column:
        raise HTTPException(status_code=404, detail="Столбец не найден")
    return db_column

# получить все колонки доски
@router.get("/", response_model=List[ColumnResponse])
def get_columns(board_id: int, db: Session = Depends(get_db)):
    stmt = select(KanbanColumn).where(KanbanColumn.board_id == board_id)
    return db.scalars(stmt).all()

# обновить название колонки
@router.put("/{column_id}", response_model=ColumnResponse)
def update_column(
    column_id: int,
    column_update: ColumnUpdate,
    db: Session = Depends(get_db)
):
    stmt = select(KanbanColumn).where(KanbanColumn.id == column_id)
    db_column = db.scalars(stmt).one_or_none()
    if not db_column:
        raise HTTPException(status_code=404, detail="Столбец не найден")

    if column_update.title is not None:
        db_column.title = column_update.title

    db.commit()
    db.refresh(db_column)
    return db_column

# удалить колонку
@router.delete("/{column_id}")
def delete_column(column_id: int, db: Session = Depends(get_db)):
    stmt = select(KanbanColumn).where(KanbanColumn.id == column_id)
    db_column = db.scalars(stmt).first()
    if not db_column:
        raise HTTPException(status_code=404, detail="Столбец не найден")
    db.delete(db_column)
    db.commit()
    return {"message": "Столбец удален"}

# удалить все колонки доски
@router.delete("/board/{board_id}")
def delete_columns(board_id: int, db: Session = Depends(get_db)):
    board_stmt = select(Board).where(Board.id == board_id)
    board = db.scalars(board_stmt).first()
    if not board:
        raise HTTPException(status_code=404, detail="Доска не найдена")

    delete_stmt = delete(KanbanColumn).where(KanbanColumn.board_id == board_id)
    db.execute(delete_stmt)
    db.commit()

    return {"message": "Столбцы удалены"}