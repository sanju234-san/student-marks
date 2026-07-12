from fastapi import APIRouter
from services import get_insights

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("")
async def get_model_insights():
    return get_insights()
