"""
аутентификация через query-параметр;
зависимость get_current_user используется в эндпоинтах, где нужно 
определить текущего пользователя по переданному id
"""

from fastapi import Query, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from models import User


def get_current_user(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    получает пользователя из БД по id из query-параметра.
    args:
    user_id: id пользователя
    db: сессия БД;
    returns:
    объект User, если найден;
    raises:
    HTTPException 404: пользователь не существует в БД
    """
    stmt = select(User).where(User.id == user_id)
    user = db.scalars(stmt).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return user