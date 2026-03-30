from fastapi import Query, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import User

def get_current_user(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    stmt = select(User).where(User.id == user_id)
    user = db.scalars(stmt).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user