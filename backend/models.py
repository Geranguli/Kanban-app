"""
ORM-модели SQLAlchemy 
Архитектура:
User -> Board -> KanbanColumn -> Card -> CardImage
(1:N на каждом уровне)

- relationship() для навигации между объектами
- cascade="all, delete-orphan" для автоматического удаления дочерних записей
- order_by в relationship для автоматической сортировки при подгрузке
- ondelete="CASCADE" 
"""

from database import Base
from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship

"""
Пользователь системы;
Поле username уникально;
boards - обратная связь
"""
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)

    # 1 пользователь - много досок
    boards = relationship("Board", back_populates="user", cascade="all, delete-orphan")

"""
Доска. Принадлежит одному пользователю, содержит колонки;
columns сортируются автоматически по position при подгрузке 
через relationship (order_by)
"""
class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    
    # Много досок - 1 пользователь
    user = relationship("User", back_populates="boards")
    
    # 1 доска - много колонок
    columns = relationship(
        "KanbanColumn", 
        back_populates="board", 
        cascade="all, delete-orphan", 
        order_by="KanbanColumn.position"
    )

"""
Колонка на доске;
position - порядок отображения слева направо;
cards сортируются по position при подгрузке
"""
class KanbanColumn(Base):
    __tablename__ = "columns"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"))
    position = Column(Integer)  # Порядок в доске

    # Много колонок - 1 доска
    board = relationship("Board", back_populates="columns")
    
    # 1 колонка - много карточек
    cards = relationship(
        "Card", 
        back_populates="column", 
        cascade="all, delete-orphan", 
        order_by="Card.position"
    )

"""
Карточка в колонке;
position - порядок в колонке;
due_date - срок выполнения
"""
class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)    
    due_date = Column(Date)         # Только дата, без времени
    column_id = Column(Integer, ForeignKey("columns.id", ondelete="CASCADE"))
    position = Column(Integer)      # Порядок в колонке

    # Много карточек - 1 колонка
    column = relationship("KanbanColumn", back_populates="cards")

    # 1 карточка - много изображений
    images = relationship(
        "CardImage",
        back_populates="card",
        cascade="all, delete-orphan"
    )

"""
Изображение, прикрепленное к карточке;
url - относительный путь к файлу;
При удалении карточки изображения удаляются каскадно
"""
class CardImage(Base):
    __tablename__ = "card_images"

    id = Column(Integer, primary_key=True)
    url = Column(String, nullable=False)  # Путь к файлу

    card_id = Column(Integer, ForeignKey("cards.id", ondelete="CASCADE"))
    card = relationship("Card", back_populates="images")