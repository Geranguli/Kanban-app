from fastapi import FastAPI
from routers import users, boards, columns, cards
from database import engine, Base
from models import User, Board, KanbanColumn, Card

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Kanban"}

Base.metadata.create_all(bind=engine)

app.include_router(users.router)
app.include_router(boards.router)
app.include_router(columns.router)
app.include_router(cards.router)