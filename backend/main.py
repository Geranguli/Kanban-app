"""
Точка входа FastAPI-приложения;
CORS для фронтенда на localhost:5173;
статические файлы для загруженных изображений (/uploads);
глобальные обработчики исключений (exception handlers);
автоматическое создание таблиц при старте (create_all)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from database import engine, Base
from models import User, Board, KanbanColumn, Card
from routers import boards, users, columns, cards
from fastapi.staticfiles import StaticFiles

import logging

app = FastAPI()

# логирование для отладки ошибок БД и неожиданных исключений
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def read_root():
    """Health-check эндпоинт."""
    return {"message": "Kanban"}


# Создаем таблицы при первом запуске
Base.metadata.create_all(bind=engine)

# Подключение роутеров
app.include_router(users.router)
app.include_router(boards.router)
app.include_router(columns.router)
app.include_router(cards.router)


# Глобальные обработчики исключений
# Возвращают единообразный JSON-формат

"""
Обработка HTTP-исключений;
возвращает структуру {success: false, message: ...}
"""
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
        },
    )

"""
Обработка ошибок валидации Pydantic 
включает details с указанием проблемных полей 
"""
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Ошибка валидации данных",
            "errors": exc.errors(),  # Массив ошибок по полям
        },
    )

"""
Обработка ошибок базы данных;
логирует полную ошибку на сервере, но возвращает пользователю
обезличенное сообщение 
"""
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"DB ERROR: {exc}")

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Ошибка базы данных",
        },
    )

"""
обработчик для непредвиденных исключений;
ловит все, что не поймали обработчики выше
"""
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"UNEXPECTED ERROR: {exc}")

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Внутренняя ошибка сервера",
        },
    )