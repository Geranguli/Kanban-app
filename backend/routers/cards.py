from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from sqlalchemy import select, delete, func
from models import KanbanColumn, Card, CardImage
from schemas import CardCreate, CardUpdate, CardResponse, CardMove
from typing import List
from datetime import date, datetime
import os
import uuid

UPLOAD_DIR = "uploads"

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

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

# все карточки доски одним запросом
@router.get("/board/{board_id}", response_model=List[CardResponse])
def get_board_cards(board_id: int, db: Session = Depends(get_db)):
    stmt = (
        select(Card)
        .join(KanbanColumn, Card.column_id == KanbanColumn.id)
        .where(KanbanColumn.board_id == board_id)
        .order_by(Card.column_id, Card.position)
    )
    return db.scalars(stmt).all()

@router.post("/", response_model=CardResponse)
def create_card(card: CardCreate, column_id: int, db: Session = Depends(get_db)):
    stmt = select(KanbanColumn).where(KanbanColumn.id == column_id)
    column = db.scalars(stmt).first()
    if not column:
        raise HTTPException(status_code=404, detail="Столбец не найден")

    max_position_stmt = select(func.max(Card.position)).where(Card.column_id == column_id)
    max_position = db.scalar(max_position_stmt)
    new_position = 0 if max_position is None else max_position + 1

    db_card = Card(
        title=card.title,
        description=card.description,
        due_date=card.due_date,
        column_id=column_id,
        position=new_position
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

# Оставляем для обратной совместимости, но фронт больше не использует
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
    result = db.execute(cards_stmt)
    db.commit()

    return {
        "message": f"Удалено карточек: {result.rowcount}",
        "column_id": column_id
    }
# move - возвращает все карточки доски для стабильности
@router.patch("/{card_id}/move", response_model=List[CardResponse])
def move_card(card_id: int, move: CardMove, db: Session = Depends(get_db)):
    db_card = db.scalar(select(Card).where(Card.id == card_id))
    if not db_card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

    old_column_id = db_card.column_id
    old_position = db_card.position
    new_column_id = move.new_column
    new_position = move.new_position

    column = db.scalar(select(KanbanColumn).where(KanbanColumn.id == new_column_id))
    if not column:
        raise HTTPException(status_code=404, detail="Столбец не найден")

    # Получаем board_id для возврата всех карточек
    board_id = column.board_id

    cards_in_new_column = db.scalars(
        select(Card)
        .where(Card.column_id == new_column_id)
        .order_by(Card.position)
    ).all()

    # Ограничиваем позицию
    if new_position < 0:
        new_position = 0
    if new_position > len(cards_in_new_column):
        new_position = len(cards_in_new_column)

    if old_column_id == new_column_id:
        if old_position < new_position:
            for card in cards_in_new_column:
                if old_position < card.position <= new_position:
                    card.position -= 1
        elif old_position > new_position:
            for card in cards_in_new_column:
                if new_position <= card.position < old_position:
                    card.position += 1
    else:
        # Старая колонка — уменьшаем позиции
        old_cards = db.scalars(
            select(Card).where(Card.column_id == old_column_id)
        ).all()
        for card in old_cards:
            if card.position > old_position:
                card.position -= 1

        # Новая колонка — увеличиваем позиции
        for card in cards_in_new_column:
            if card.position >= new_position:
                card.position += 1

        db_card.column_id = new_column_id

    db_card.position = new_position
    db.commit()

    #  Возвращаем все карточки доски 
    stmt = (
        select(Card)
        .join(KanbanColumn, Card.column_id == KanbanColumn.id)
        .where(KanbanColumn.board_id == board_id)
        .order_by(Card.column_id, Card.position)
    )
    return db.scalars(stmt).all()

@router.post("/{card_id}/images", response_model=CardResponse)
def upload_images(
    card_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    card = db.scalar(select(Card).where(Card.id == card_id))
    if not card:
        raise HTTPException(status_code=404, detail="Карточка не найдена")

    for file in files:
        filename = f"{uuid.uuid4()}_{file.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as buffer:
            buffer.write(file.file.read())

        image = CardImage(url=filepath, card_id=card_id)
        db.add(image)

    db.commit()
    db.refresh(card)

    return card

@router.delete("/images/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    image = db.scalar(select(CardImage).where(CardImage.id == image_id))
    if not image:
        raise HTTPException(status_code=404, detail="Изображение не найдено")

    if os.path.exists(image.url):
        os.remove(image.url)

    db.delete(image)
    db.commit()

    return {"message": "Изображение удалено"}