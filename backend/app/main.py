from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.common import settings
from app.routers import admin, auth, bookings, instructors, public, quiz_management, quizzes, setup, students
from app.startup import lifespan

app = FastAPI(title="Driving School API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router_module in (public, setup, auth, quizzes, quiz_management, admin, instructors, students, bookings):
    app.include_router(router_module.router)
