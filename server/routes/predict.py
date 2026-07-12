from fastapi import APIRouter
from schemas import PredictionRequest, PredictionResponse
from services import predict

router = APIRouter(prefix="/predict", tags=["prediction"])


@router.post("", response_model=PredictionResponse)
async def predict_marks(request: PredictionRequest):
    features = request.model_dump()
    predicted, confidence = predict(features)
    return {
        "predicted_marks": predicted,
        "confidence_range": confidence
    }
