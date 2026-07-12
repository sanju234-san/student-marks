# Student Marks Predictor

A full-stack machine learning web application for predicting student marks based on various factors, with a dark-themed, data-science-inspired UI.

## Problem Statement
We aim to predict student performance (marks out of 100) using features such as study hours, attendance, previous exam scores, sleep hours, and extracurricular activity hours. The application compares multiple regression models to select the best-performing one for prediction.

## Model Comparison
The training script evaluates four models:
1. **Linear Regression**
2. **Ridge Regression**
3. **Lasso Regression**
4. **Polynomial Regression (degree 2)**

Models are compared using R² score, MAE (Mean Absolute Error), and RMSE (Root Mean Squared Error). The model with the highest R² score is selected as the best model for predictions.

## Project Structure
```
student-marks/
├── client/                # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── App.jsx       # Main application component
│   │   ├── main.jsx      # Entry point
│   │   └── index.css     # Tailwind CSS styles
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/                # FastAPI backend
│   ├── data/             # Synthetic dataset
│   ├── models/           # Saved model, coefficients, plots
│   │   └── plots/
│   ├── routes/           # API endpoints
│   ├── schemas/          # Pydantic models
│   ├── services/         # Prediction service
│   ├── main.py           # FastAPI entry point
│   ├── train_model.py    # Model training script
│   └── requirements.txt
└── README.md
```

## How to Run

### 1. Set Up and Train the Model
```bash
cd server
pip install -r requirements.txt
python train_model.py
```
This generates the synthetic dataset, trains all four models, saves the best model and evaluation results.

### 2. Start the Backend Server
```bash
cd server
uvicorn main:app --reload
```
The API will be available at http://localhost:8000, and Swagger docs at http://localhost:8000/docs.

### 3. Start the Frontend
Open a new terminal:
```bash
cd client
npm install
npm run dev
```
The app will be available at http://localhost:5173.

## Features
- **Input Form**: Sliders and number inputs for all 5 features with validation
- **Prediction Result**: Large glowing number with confidence range
- **Scatter Plot**: Study hours vs marks with regression line
- **What-If Analysis**: Real-time prediction updates as study hours slider changes
- **Model Insights**: Model comparison table and feature importance bar chart
- **Dark UI**: Dark theme with cyan/violet accents, monospace for numbers

## Technologies Used
- **Backend**: FastAPI, scikit-learn, pandas, numpy, joblib, matplotlib
- **Frontend**: React, Vite, Tailwind CSS, Recharts
