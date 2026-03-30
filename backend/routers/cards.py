from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import select, delete
from models import KanbanColumn, Card
from schemas import CardCreate, CardUpdate, CardResponse
from typing import List
from datetime import date, datetime

def is_valid_date(date_obj):
    try:
        datetime.strptime(str(date_obj), "%Y-%m-%d")
        return True
    except ValueError:
        return False

router = APIRouter(
    prefix="/cards",
    tags=["Cards"]
)

@router.post("/", response_model=CardResponse)
def create_card(card: CardCreate, column_id: int, db: Session = Depends(get_db)):
    stmt = select(KanbanColumn).where(KanbanColumn.id == column_id)
    column = db.scalars(stmt).first()
    if not column:
        raise HTTPException(status_code=404, detail="Столбец не найден")

    if card.due_date:
        if not is_valid_date(card.due_date):
            raise HTTPException(status_code=400, detail="Некорректная дата")
        if card.due_date < date.today():
            raise HTTPException(status_code=400, detail="Дата выполнения не может быть в прошлом")

    db_card = Card(
        title=card.title,
        description=card.description,
        due_date=card.due_date,
        column_id=column_id
    )
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

@router.get("/{card_id}", response_model=CardResponse)
def get_card(card_id: int, db: Session = Depends(get_db)):
    stmt = select(Card).where(Card.id == card_id)
    db_card = db.scalars(stmt).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")
    return db_card

@router.get("/", response_model=List[CardResponse])
def get_cards(column_id: int, db: Session = Depends(get_db)):
    stmt = select(Card).where(Card.column_id == column_id)
    return db.scalars(stmt).all()

@router.put("/{card_id}", response_model=CardResponse)
def update_card(card_id: int, card_update: CardUpdate, db: Session = Depends(get_db)):
    stmt = select(Card).where(Card.id == card_id)
    db_card = db.scalars(stmt).one_or_none()
    if not db_card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

    if card_update.title is not None:
        db_card.title = card_update.title
    if card_update.description is not None:
        db_card.description = card_update.description
    if card_update.due_date is not None:
        if not is_valid_date(card_update.due_date):
            raise HTTPException(status_code=400, detail="Некорректная дата")
        db_card.due_date = card_update.due_date

    db.commit()
    db.refresh(db_card)
    return db_card


@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    stmt = select(Card).where(Card.id == card_id)
    db_card = db.scalars(stmt).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")
    db.delete(db_card)
    db.commit()
    return {"message": "Карточка удалена"}


@router.delete("/")
def delete_cards(column_id: int, db: Session = Depends(get_db)):
    column_stmt = select(KanbanColumn).where(KanbanColumn.id == column_id)
    column = db.scalars(column_stmt).first()
    if not column:
        raise HTTPException(status_code=404, detail="Столбец не найден")

    cards_stmt = delete(Card).where(Card.column_id == column_id)
    db.execute(cards_stmt)
    db.commit()

    return {"message": "Карточки удалены"}