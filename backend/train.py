# -*- coding: utf-8 -*-
"""
Model training and selection pipeline
Adapted from ML Python/untitled38.py
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression, LogisticRegression, Ridge
from sklearn.metrics import ( accuracy_score, classification_report, f1_score, mean_absolute_error, mean_squared_error, r2_score,)
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, OneHotEncoder, StandardScaler
from sklearn.ensemble import (ExtraTreesClassifier, ExtraTreesRegressor, GradientBoostingClassifier, GradientBoostingRegressor, RandomForestClassifier, RandomForestRegressor, HistGradientBoostingRegressor,)

# Ensure models directory exists
os.makedirs('models', exist_ok=True)

# 1) LOAD DATA
FILE_PATH = 'data/lung_cancer_realistic_synthetic_50000.csv'
if not os.path.exists(FILE_PATH):
    raise FileNotFoundError(f"Dataset not found at {FILE_PATH}. Please verify the path.")

print('Loading dataset...')
df = pd.read_csv(FILE_PATH)

print('Dataset shape:', df.shape)
print('Columns:', list(df.columns))
print('\nStage distribution:')
print(df['Stage'].value_counts())
print('\nSurvival months summary:')
print(df['Survival_Months'].describe())

# 2) FEATURE SETS FOR EACH TASK
# predict Survival_Months (regression)
regression_target = 'Survival_Months'
regression_drop = ['Patient_ID', 'Survival_Months', 'Stage']
X_reg = df.drop(columns=regression_drop)
y_reg = df[regression_target]

# predict Stage (classification)
classification_target = 'Stage'
classification_drop = ['Patient_ID', 'Stage', 'Survival_Months']
X_clf = df.drop(columns=classification_drop)
y_clf = df[classification_target]

# Label encode stage labels: I, II, III, IV
label_encoder = LabelEncoder()
y_clf_encoded = label_encoder.fit_transform(y_clf)

# 3) PREPROCESSING
def make_preprocessor(X: pd.DataFrame) -> ColumnTransformer:
    categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
    numeric_cols = X.select_dtypes(exclude=['object']).columns.tolist()

    numeric_transformer = Pipeline(
        steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore')),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_cols),
            ('cat', categorical_transformer, categorical_cols),
        ]
    )
    return preprocessor

reg_preprocessor = make_preprocessor(X_reg)
clf_preprocessor = make_preprocessor(X_clf)

# 4) TRAIN / TEST SPLIT
X_reg_train, X_reg_test, y_reg_train, y_reg_test = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

X_clf_train, X_clf_test, y_clf_train, y_clf_test = train_test_split(
    X_clf,
    y_clf_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_clf_encoded,
)

# 5) FIVE MODELS FOR SURVIVAL MONTHS (REGRESSION)
regression_models = {
    'LinearRegression': LinearRegression(),
    'Ridge': Ridge(alpha=1.0),
    'RandomForestRegressor': RandomForestRegressor(
        n_estimators=150, random_state=42, n_jobs=-1
    ),
    'ExtraTreesRegressor': ExtraTreesRegressor(
        n_estimators=300,
        max_depth=20,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    ),
    'GradientBoostingRegressor': GradientBoostingRegressor(random_state=42),
    'HistGradientBoostingRegressor': HistGradientBoostingRegressor(random_state=42),
}

regression_results = []
best_reg_model_name = None
best_reg_pipeline = None
best_reg_rmse = np.inf

print('\n' + '=' * 70)
print('SURVIVAL MONTHS PREDICTION (REGRESSION)')
print('=' * 70)

for name, model in regression_models.items():
    print(f'Training Regression Model: {name}...')
    pipeline = Pipeline(
        steps=[
            ('preprocessor', reg_preprocessor),
            ('model', model),
        ]
    )

    pipeline.fit(X_reg_train, y_reg_train)
    preds = pipeline.predict(X_reg_test)

    mae = mean_absolute_error(y_reg_test, preds)
    rmse = np.sqrt(mean_squared_error(y_reg_test, preds))
    r2 = r2_score(y_reg_test, preds)

    regression_results.append(
        {
            'Model': name,
            'MAE': round(mae, 4),
            'RMSE': round(rmse, 4),
            'R2': round(r2, 4),
        }
    )

    if rmse < best_reg_rmse:
        best_reg_rmse = rmse
        best_reg_model_name = name
        best_reg_pipeline = pipeline

regression_results_df = pd.DataFrame(regression_results).sort_values(by='RMSE')
print('\nRegression Results:')
print(regression_results_df.to_string(index=False))
print(f'\nBest regression model selected: {best_reg_model_name}')

# Save best regression model
joblib.dump(best_reg_pipeline, 'models/best_survival_model.pkl')
print("Saved best survival model -> models/best_survival_model.pkl")

# 6) FIVE MODELS FOR STAGE PREDICTION (CLASSIFICATION)
classification_models = {
    'LogisticRegression': LogisticRegression(max_iter=3000),
    'RandomForestClassifier': RandomForestClassifier(
        n_estimators=150, random_state=42, n_jobs=-1
    ),
    'ExtraTreesClassifier': ExtraTreesClassifier(
        n_estimators=150, random_state=42, n_jobs=-1
    ),
    'GradientBoostingClassifier': GradientBoostingClassifier(random_state=42),
    'KNeighborsClassifier': KNeighborsClassifier(n_neighbors=11),
}

classification_results = []
best_clf_model_name = None
best_clf_pipeline = None
best_clf_f1 = -np.inf

print('\n' + '=' * 70)
print('STAGE PREDICTION (CLASSIFICATION)')
print('=' * 70)

for name, model in classification_models.items():
    print(f'Training Classification Model: {name}...')
    pipeline = Pipeline(
        steps=[
            ('preprocessor', clf_preprocessor),
            ('model', model),
        ]
    )

    pipeline.fit(X_clf_train, y_clf_train)
    preds = pipeline.predict(X_clf_test)

    acc = accuracy_score(y_clf_test, preds)
    f1 = f1_score(y_clf_test, preds, average='weighted')

    classification_results.append(
        {
            'Model': name,
            'Accuracy': round(acc, 4),
            'Weighted_F1': round(f1, 4),
        }
    )

    if f1 > best_clf_f1:
        best_clf_f1 = f1
        best_clf_model_name = name
        best_clf_pipeline = pipeline

classification_results_df = pd.DataFrame(classification_results).sort_values(
    by='Weighted_F1', ascending=False
)
print('\nClassification Results:')
print(classification_results_df.to_string(index=False))
print(f'\nBest classification model selected: {best_clf_model_name}')

# Detailed report for best classifier
best_stage_preds = best_clf_pipeline.predict(X_clf_test)
print('\nClassification report for best stage model:')
print(
    classification_report(
        y_clf_test,
        best_stage_preds,
        target_names=label_encoder.classes_,
    )
)

# Save best classifier and label encoder
joblib.dump(best_clf_pipeline, 'models/best_stage_model.pkl')
joblib.dump(label_encoder, 'models/stage_label_encoder.pkl')
print('Saved best stage model -> models/best_stage_model.pkl')
print('Saved stage label encoder -> models/stage_label_encoder.pkl')
print('\nModel Training Pipeline Completed Successfully.')
