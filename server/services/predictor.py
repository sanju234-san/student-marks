import joblib
import json
import pandas as pd

# Load model and metadata once at startup
model = None
residual_std = None
coefficients = None
model_comparison = None
dataset = None


def load_resources():
    global model, residual_std, coefficients, model_comparison, dataset
    if model is None:
        print("Loading model and resources...")
        model = joblib.load("models/model.pkl")
        with open("models/residual_std.json", "r") as f:
            residual_std = json.load(f)["residual_std"]
        with open("models/coefficients.json", "r") as f:
            coefficients = json.load(f)
        with open("models/model_comparison.json", "r") as f:
            model_comparison = json.load(f)
        dataset = pd.read_csv("data/student_data.csv")
        print("Resources loaded successfully!")


def predict(features: dict) -> tuple[float, float]:
    """
    Predict marks and return confidence range (± residual std)
    """
    load_resources()
    input_df = pd.DataFrame([features])
    prediction = model.predict(input_df)[0]
    return float(prediction), residual_std


def get_insights():
    """
    Return all insights data: coefficients, model comparison, dataset points
    """
    load_resources()
    dataset_points = dataset[["study_hours", "marks"]].to_dict("records")
    return {
        "coefficients": coefficients,
        "model_comparison": model_comparison,
        "dataset_points": dataset_points
    }
