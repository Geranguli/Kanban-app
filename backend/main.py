from fastapi import FastAPI
from routers import users, boards
from database import engine, Base
from models import User

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Kanban"}

Base.metadata.create_all(bind=engine)

app.include_router(users.router)
app.include_router(boards.router)