"""
Конфигурация SQLAlchemy и управление сессиями.
Используем SQLite для простоты развертывания. 
check_same_thread=False для SQLite в многопоточном 
контексте (каждый запрос получает свою сессию через Depends);
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./kanban.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

class Base(DeclarativeBase): pass

# autoflush=False: не отправляем запросы в БД до явного commit()
SessionLocal = sessionmaker(autoflush=False, bind=engine)

"""
Генератор сессий БД;
закрытие сессии даже при исключении;
используется во всех роутерах как Depends(get_db)
"""
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()