from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import User, Board, KanbanColumn, Card
from routers import boards, users, columns, cards
from fastapi.staticfiles import StaticFiles


app = FastAPI()

# запросы с фронтенда 
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
    return {"message": "Kanban"}

Base.metadata.create_all(bind=engine)

app.include_router(users.router)
app.include_router(boards.router)
app.include_router(columns.router)
app.include_router(cards.router)