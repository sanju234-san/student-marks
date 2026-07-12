from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import predict_router, insights_router
from services import load_resources

app = FastAPI(title="Student Marks Predictor API")

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:5173",  # Vite default dev port
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict_router)
app.include_router(insights_router)


@app.on_event("startup")
async def startup_event():
    load_resources()


@app.get("/")
async def root():
    return {"message": "Student Marks Predictor API"}
