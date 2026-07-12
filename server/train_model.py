import numpy as np
import pandas as pd
import joblib
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import PolynomialFeatures, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
import matplotlib.pyplot as plt

# Create directories if they don't exist
os.makedirs('data', exist_ok=True)
os.makedirs('models', exist_ok=True)
os.makedirs('models/plots', exist_ok=True)

# Step 1: Generate synthetic dataset
np.random.seed(42)
n_samples = 400

study_hours = np.random.uniform(1, 10, n_samples)
attendance_percentage = np.random.uniform(50, 100, n_samples)
previous_exam_score = np.random.uniform(30, 100, n_samples)
sleep_hours = np.random.uniform(4, 10, n_samples)
extracurricular_hours = np.random.uniform(0, 5, n_samples)

# Non-linear relationship with noise
base_marks = (
    5 * study_hours + 
    0.5 * attendance_percentage + 
    0.6 * previous_exam_score + 
    2 * sleep_hours - 
    1 * extracurricular_hours +
    -0.2 * (study_hours ** 2)
)
noise = np.random.normal(0, 8, n_samples)
marks = np.clip(base_marks + noise, 0, 100)

# Create DataFrame
data = pd.DataFrame({
    'study_hours': study_hours,
    'attendance_percentage': attendance_percentage,
    'previous_exam_score': previous_exam_score,
    'sleep_hours': sleep_hours,
    'extracurricular_hours': extracurricular_hours,
    'marks': marks
})

# Save dataset
data.to_csv('data/student_data.csv', index=False)
print('Dataset saved to data/student_data.csv')

# Step 2: Split data
X = data.drop('marks', axis=1)
y = data['marks']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Step 3: Define models
models = {
    'Linear Regression': LinearRegression(),
    'Ridge': Ridge(alpha=1.0),
    'Lasso': Lasso(alpha=0.1),
    'Polynomial Regression': Pipeline([
        ('poly', PolynomialFeatures(degree=2, include_bias=False)),
        ('scaler', StandardScaler()),
        ('linear', LinearRegression())
    ])
}

# Step 4: Train and evaluate
results = []
best_model = None
best_r2 = -float('inf')
best_model_name = None
best_y_pred = None

for name, model in models.items():
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    results.append({
        'Model': name,
        'R²': r2,
        'MAE': mae,
        'RMSE': rmse
    })
    
    if r2 > best_r2:
        best_r2 = r2
        best_model = model
        best_model_name = name
        best_y_pred = y_pred

# Step 5: Print comparison table
results_df = pd.DataFrame(results)
print('\nModel Comparison:')
print(results_df.to_string(index=False))

# Save comparison results for later use in insights endpoint
results_df.to_dict('records')
with open('models/model_comparison.json', 'w') as f:
    json.dump(results_df.to_dict('records'), f, indent=2)

# Step 6: Save best model
joblib.dump(best_model, 'models/model.pkl')
print(f'\nBest model saved: {best_model_name} (R² = {best_r2:.4f})')

# Step 7: Save coefficients (if available)
coefficients = {}
feature_names = X.columns.tolist()

if hasattr(best_model, 'coef_'):
    # For linear models
    coeffs = best_model.coef_
    if len(coeffs) == len(feature_names):
        coefficients = dict(zip(feature_names, coeffs))
elif hasattr(best_model, 'named_steps') and 'linear' in best_model.named_steps:
    # For polynomial pipeline
    linear_model = best_model.named_steps['linear']
    poly_features = best_model.named_steps['poly']
    poly_feature_names = poly_features.get_feature_names_out(feature_names)
    coefficients = dict(zip(poly_feature_names, linear_model.coef_))

with open('models/coefficients.json', 'w') as f:
    json.dump(coefficients, f, indent=2)
print('Coefficients saved to models/coefficients.json')

# Step 8: Generate and save plots

# Residuals plot
residuals = y_test - best_y_pred
plt.figure(figsize=(10, 6))
plt.scatter(best_y_pred, residuals, alpha=0.6)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('Predicted Marks')
plt.ylabel('Residuals')
plt.title(f'Residuals Plot - {best_model_name}')
plt.savefig('models/plots/residuals.png')
plt.close()
print('Residuals plot saved to models/plots/residuals.png')

# Predicted vs Actual plot
plt.figure(figsize=(10, 6))
plt.scatter(y_test, best_y_pred, alpha=0.6, label='Data Points')
plt.plot([y.min(), y.max()], [y.min(), y.max()], 'r--', label='Perfect Prediction')
plt.xlabel('Actual Marks')
plt.ylabel('Predicted Marks')
plt.title(f'Predicted vs Actual - {best_model_name}')
plt.legend()
plt.savefig('models/plots/predicted_vs_actual.png')
plt.close()
print('Predicted vs Actual plot saved to models/plots/predicted_vs_actual.png')

# Also save residual std for confidence interval
residual_std = np.std(residuals)
with open('models/residual_std.json', 'w') as f:
    json.dump({'residual_std': float(residual_std)}, f)
print(f'Residual std saved: {residual_std:.4f}')
