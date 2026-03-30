from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import User
from schemas import UserCreate, UserResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

# если пользователь с таким именем уже есть - возвращаем его, если нет - создаём нового
@router.post("/login", response_model=UserResponse)
def login(user: UserCreate, db: Session = Depends(get_db)):
    stmt = select(User).where(User.username == user.username)
    db_user = db.scalars(stmt).first()
    if not db_user:
        db_user = User(username=user.username)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    stmt = select(User).where(User.id == user_id)
    db_user = db.scalars(stmt).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return db_user