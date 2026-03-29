from database import Base
from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)

    # 1 юзер - много досок
    boards = relationship("Board", back_populates="user", cascade="all, delete-orphan")

class Board(Base):
    __tablename__ = "boards"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    #много досок - 1 юзер
    user = relationship("User", back_populates="boards")
    # 1 доска - много колонок
    columns = relationship("KanbanColumn", back_populates="board", cascade="all, delete-orphan", order_by="KanbanColumn.position")

class KanbanColumn(Base):
    __tablename__ = "columns"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    board_id = Column(Integer, ForeignKey("boards.id", ondelete="CASCADE"))
    position = Column(Integer) # номер места для карточки (куда переместить)

    #много колонок - 1 доска
    board = relationship("Board", back_populates="columns")
    #1 колонка - 1 карточка
    cards = relationship("Card", back_populates="column", cascade="all, delete-orphan", order_by="Card.position")

class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(Text)
    due_date = Column(Date)
    column_id = Column(Integer, ForeignKey("columns.id", ondelete="CASCADE"))
    position = Column(Integer) # порядок карточки в колонке
    # много карточек - 1 колонка
    column = relationship("KanbanColumn", back_populates="cards")