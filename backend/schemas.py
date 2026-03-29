from pydantic import BaseModel, ConfigDict
from datetime import date
from typing import List, Optional

# User
class UserCreate(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: int
    username: str
    model_config = ConfigDict(from_attributes=True)

# Card

class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    position: Optional[int] = None

class CardCreate(CardBase):
    pass

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    column_id: Optional[int] = None
    position: Optional[int] = None

class CardResponse(CardBase):
    id: int
    column_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

#для drag_and_drop
class CardMove(BaseModel):
    new_column: int
    new_position: int


# Column

class ColumnBase(BaseModel):
    title: str
    position: Optional[int] = None

class ColumnCreate(ColumnBase):
    pass

class ColumnUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None

class ColumnResponse(ColumnBase):
    id: int
    board_id: int
    cards: List[CardResponse] = []
    model_config = ConfigDict(from_attributes=True)

# Board

class BoardBase(BaseModel):
    title: str

class BoardCreate(BoardBase):
    pass

class BoardUpdate(BaseModel):
    title: Optional[str] = None

class BoardResponse(BoardBase):
    id: int
    user_id: int
    columns: List[ColumnResponse] = []
    model_config = ConfigDict(from_attributes=True)