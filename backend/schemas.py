"""
Pydantic-схемы для валидации запросов и сериализации ответов
Используем ConfigDict(from_attributes=True) 
Структура:
Base: общие поля для создания/обновления
Create: для POST-запросов (все обязательные поля)
Update: для PUT/PATCH (все Optional - частичное обновление)
Response: для ответов API 
"""

from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import List, Optional


#  User 

class UserCreate(BaseModel):
    #Данные для создания пользователя
    username: str


class UserResponse(BaseModel):
    #Пользователь в ответе API. Включает id для идентификации
    id: int
    username: str
    model_config = ConfigDict(from_attributes=True)


# Image 

class ImageResponse(BaseModel):
    #url - относительный путь для сборки полного URL 
    id: int
    url: str
    model_config = ConfigDict(from_attributes=True)


# Card 

class CardBase(BaseModel):
    #Базовые поля карточки
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    position: Optional[int] = None


class CardCreate(CardBase):
    pass

"""
Частичное обновление карточки;
Все поля Optional
"""
class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    column_id: Optional[int] = None
    position: Optional[int] = None

"""
Карточка в ответе API;
включает column_id для группировки на фронтенде и 
images (пустой массив, если нет вложений)
"""
class CardResponse(CardBase):
    id: int
    column_id: Optional[int] = None
    images: List[ImageResponse] = []
    model_config = ConfigDict(from_attributes=True)


# DnD 

"""
Параметры перемещения карточки;
new_column - id целевой колонки;
new_position - индекс в списке карточек колонки
"""
class CardMove(BaseModel):
    new_column: int
    new_position: int


#  Column 

class ColumnBase(BaseModel):
    #Базовые поля колонки
    title: str
    position: Optional[int] = None


class ColumnCreate(ColumnBase):
    pass


class ColumnUpdate(BaseModel):
    #Обновление колонки
    title: Optional[str] = None
    position: Optional[int] = None

"""
Колонка в ответе API;
Включает cards[] - при полной загрузке доски через BoardResponse 
здесь будут вложенные карточки 
"""
class ColumnResponse(ColumnBase):
    id: int
    board_id: int
    cards: List[CardResponse] = []
    model_config = ConfigDict(from_attributes=True)


#  Board 

class BoardBase(BaseModel):
    title: str


class BoardCreate(BoardBase):
    pass


class BoardUpdate(BaseModel):
    title: Optional[str] = None

"""
Доска в ответе API;
Включает вложенные колонки с карточками
"""
class BoardResponse(BoardBase):
    id: int
    user_id: int
    columns: List[ColumnResponse] = []
    model_config = ConfigDict(from_attributes=True)