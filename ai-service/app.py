from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_percentage_error
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from xgboost import XGBRegressor

app = Flask(__name__)
CORS(app)


def _build_features(values):
    rows = []
    for idx, value in enumerate(values):
        previous = values[idx - 1] if idx >= 1 else value
        lag_2 = values[idx - 2] if idx >= 2 else previous
        window_3 = values[max(0, idx - 2):idx + 1]
        window_6 = values[max(0, idx - 5):idx + 1]
        rolling_3 = np.mean(window_3)
        rolling_6 = np.mean(window_6)
        month = ((idx % 12) + 1)
        sin_month = np.sin(2 * np.pi * month / 12)
        cos_month = np.cos(2 * np.pi * month / 12)
        monthly_change = previous - lag_2
        volatility = np.std(window_6)
        rows.append([
            idx + 1,
            previous,
            lag_2,
            rolling_3,
            rolling_6,
            monthly_change,
            volatility,
            month,
            sin_month,
            cos_month,
        ])
    return np.array(rows, dtype=float)


def _future_features(history, horizon):
    values = list(history)
    rows = []
    for _ in range(horizon):
        idx = len(values)
        previous = values[-1]
        lag_2 = values[-2] if len(values) >= 2 else previous
        rolling_3 = np.mean(values[-3:])
        rolling_6 = np.mean(values[-6:])
        month = ((idx % 12) + 1)
        sin_month = np.sin(2 * np.pi * month / 12)
        cos_month = np.cos(2 * np.pi * month / 12)
        monthly_change = previous - lag_2
        volatility = np.std(values[-6:])
        rows.append([
            idx + 1,
            previous,
            lag_2,
            rolling_3,
            rolling_6,
            monthly_change,
            volatility,
            month,
            sin_month,
            cos_month,
        ])
        values.append(previous)
    return np.array(rows, dtype=float)


def _fit_predict_series(values):
    values = np.array(values, dtype=float)
    X = _build_features(values)
    y = values

    models = [
        ("XGBoost", XGBRegressor(n_estimators=200, learning_rate=0.1, max_depth=3, random_state=42, objective='reg:squarederror', eval_metric='mae', verbosity=0, n_jobs=-1)),
        ("Random Forest", RandomForestRegressor(n_estimators=120, max_depth=4, random_state=42, n_jobs=-1)),
        ("Gradient Boosting", GradientBoostingRegressor(n_estimators=120, learning_rate=0.05, max_depth=2, random_state=42)),
        ("Ridge Regression", make_pipeline(StandardScaler(), Ridge(alpha=1.0))),
    ]

    model_scores = []
    holdout = max(2, min(4, len(values) // 3))
    train_end = len(values) - holdout
    X_train, X_test = X[:train_end], X[train_end:]
    y_train, y_test = y[:train_end], y[train_end:]

    for name, model in models:
        model.fit(X_train, y_train)
        pred = np.maximum(model.predict(X_test), 0)
        mape = float(mean_absolute_percentage_error(np.maximum(y_test, 1), np.maximum(pred, 1)))
        weight = 1 / (mape + 0.05)
        model_scores.append({"name": name, "mape": mape, "weight": weight, "model": model})

    total_weight = sum(item["weight"] for item in model_scores)
    for item in model_scores:
        item["model"].fit(X, y)
        item["normalized_weight"] = item["weight"] / total_weight

    future_X = _future_features(values, 6)
    model_predictions = []
    for item in model_scores:
        prediction = np.maximum(item["model"].predict(future_X), 0)
        model_predictions.append(prediction * item["normalized_weight"])
    forecast = np.sum(model_predictions, axis=0)

    avg_mape = sum(item["mape"] * item["normalized_weight"] for item in model_scores)
    confidence = max(0.35, min(0.92, 1 - avg_mape))

    return {
        "forecast": forecast,
        "confidence": confidence,
        "backtest_mape": avg_mape,
        "model_weights": [
            {
                "model": item["name"],
                "weight": round(item["normalized_weight"], 3),
                "backtest_mape": round(item["mape"], 4),
            }
            for item in model_scores
        ],
    }


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "CashCompass AI Service"})


@app.route('/forecast/income-expense', methods=['POST'])
def forecast_income_expense():
    data = request.json or {}
    historical_data = data.get('historical_data', [])

    if len(historical_data) < 6:
        return jsonify({
            "error": "Insufficient historical data for reliable forecasting.",
            "min_required": 6,
            "provided": len(historical_data)
        }), 400

    df = pd.DataFrame(historical_data).sort_values('month')
    required = {'month', 'income', 'expense'}
    if not required.issubset(df.columns):
        return jsonify({"error": "historical_data must include month, income, and expense fields."}), 400

    income_result = _fit_predict_series(df['income'].astype(float).tolist())
    expense_result = _fit_predict_series(df['expense'].astype(float).tolist())
    pred_incomes = income_result['forecast']
    pred_expenses = expense_result['forecast']

    predictions = {
        "next_1_month": {
            "income": round(float(pred_incomes[0]), 2),
            "expense": round(float(pred_expenses[0]), 2)
        },
        "next_3_months": {
            "income": round(float(pred_incomes[2]), 2),
            "expense": round(float(pred_expenses[2]), 2)
        },
        "next_6_months": {
            "income": round(float(pred_incomes[5]), 2),
            "expense": round(float(pred_expenses[5]), 2)
        }
    }

    confidence = round(float((income_result['confidence'] + expense_result['confidence']) / 2), 3)
    explainability = {
        "algorithm": "XGBoost-Enhanced Ensemble Forecasting: XGBoost + Random Forest + Gradient Boosting + Ridge Regression",
        "data_points_used": len(historical_data),
        "features_used": ["month_index", "lag_1", "lag_2", "rolling_3_month_avg", "rolling_6_month_avg", "monthly_change", "recent_volatility", "month_of_year", "seasonal_sin", "seasonal_cos"],
        "calculation_logic": "Each model is backtested on recent months. Lower backtest error receives higher ensemble weight. Predictions combine seasonality, volatility, and trend for variable income patterns.",
        "income_model_weights": income_result['model_weights'],
        "expense_model_weights": expense_result['model_weights'],
        "income_backtest_mape": round(float(income_result['backtest_mape']), 4),
        "expense_backtest_mape": round(float(expense_result['backtest_mape']), 4),
        "confidence_level": confidence,
        "assumption": "Variable income is better captured by ensemble forecasting that includes tree-based models and seasonality features. Confidence is based on recent backtest error, not a guarantee."
    }

    return jsonify({
        "predictions": predictions,
        "explainable_ai": explainability,
        "confidence_level": confidence,
        "historical_data_used": historical_data
    })


@app.route('/stability-score', methods=['POST'])
def calculate_stability_score():
    data = request.json or {}
    net_worth = data.get('net_worth', 0)
    income = data.get('monthly_income', 0)
    expense = data.get('monthly_expense', 0)
    liabilities = data.get('liabilities', 0)

    score = 50

    if income > 0:
        savings_rate = (income - expense) / income
        if savings_rate > 0.2:
            score += 20
        elif savings_rate > 0.1:
            score += 10
        elif savings_rate < 0:
            score -= 20

    if income > 0:
        dti = liabilities / income
        if dti < 0.3:
            score += 15
        elif dti > 0.5:
            score -= 20

    if net_worth > 50000:
        score += 15
    elif net_worth > 10000:
        score += 5

    score = max(0, min(100, score))

    classification = "Stable"
    if score < 40:
        classification = "High Risk"
    elif score < 70:
        classification = "Caution"

    explainability = {
        "algorithm": "Weighted Scoring Algorithm",
        "factors_considered": ["Savings Rate", "Debt-to-Income Ratio", "Net Worth"],
        "logic": "Scores increase with high savings and low debt, and decrease with deficit spending."
    }

    return jsonify({
        "financial_stability_score": score,
        "financial_weather_forecast": classification,
        "explainable_ai": explainability
    })


if __name__ == '__main__':
    app.run(port=5000, debug=True)