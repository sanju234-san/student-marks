from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    study_hours: float = Field(..., ge=0, description='Number of study hours per week (must be non-negative)')
    attendance_percentage: float = Field(..., ge=0, le=100, description='Attendance percentage (0-100)')
    previous_exam_score: float = Field(..., ge=0, le=100, description='Previous exam score (0-100)')
    sleep_hours: float = Field(..., ge=0, description='Average sleep hours per day (must be non-negative)')
    extracurricular_hours: float = Field(..., ge=0, description='Extracurricular hours per week (must be non-negative)')


class PredictionResponse(BaseModel):
    predicted_marks: float
    confidence_range: float
