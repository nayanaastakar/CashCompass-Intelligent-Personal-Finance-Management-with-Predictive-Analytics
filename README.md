# 🧭 CashCompass: Intelligent Personal Finance Management with Predictive Analytics

CashCompass is an intelligent personal finance management platform that evaluates users' financial health using a Financial Stability Index (FSI), detects suspicious transactions using rule-based fraud detection, predicts future financial trends using Dynamic Ensemble Forecasting, and provides personalized financial recommendations through an interactive dashboard.

---

## 🚀 Key Features

* **🔮 Dynamic Ensemble Forecasting**: Predicts future income and expenses up to 6 months in advance using an ensemble of XGBoost, Random Forest, Gradient Boosting, and Ridge Regression models.
* **⚡ Scenario Simulator**: Simulates stress scenarios (e.g., a 30% drop in income or unexpected emergency expenses) to assess net worth impact and survival runways.
* **⛈️ Financial Stability Index (FSI)**: Computes a dynamic stability index score and maps it to a "financial weather forecast" (Stable, Caution, High Risk) with actionable advice.
* **💸 Spending Regret Optimizer**: Analyzes category-wise discretionary spending and generates goal-oriented recommendations to redirect savings to emergency buffers.
* **🎯 Goal Vault & Planner**: Track specific savings targets (e.g., emergency funds, equipment, tax prep) with custom targets, priorities, and automated timeline estimations.

---

## 🛠️ Tech Stack

* **Frontend**: React (v18), Vite, TailwindCSS, Recharts, Lucide Icons, jsPDF
* **Backend**: Spring Boot, Java 17, H2 Database (In-Memory/File), Spring Security + JWT
* **AI Service**: Flask (Python 3.11), Scikit-Learn, XGBoost, Pandas, Numpy

---

## 📂 Project Structure

```text
├── ai-service/             # Flask Machine Learning Service
│   ├── app.py              # Main Flask application API endpoints
│   └── requirements.txt    # Python package dependencies
├── backend/                # Spring Boot REST API
│   ├── src/                # Java sources and application properties
│   ├── pom.xml             # Maven dependencies configuration
│   └── apache-maven-*/     # Embedded Maven binaries
├── frontend/               # React + Vite UI client
│   ├── src/                # UI Components & services
│   └── package.json        # Frontend configuration
├── setup_and_run.bat       # Helper startup script for Windows dev environments
└── temp_api_check.py       # Integration sanity check script
```

---

## ⚙️ Getting Started & Run Instructions

The repository includes a helper script (`setup_and_run.bat`) to launch the entire ecosystem in one click on Windows.

### Prerequisites

1. **Java Development Kit (JDK)**: Ensure JDK 17 is installed and added to your system path.
2. **Node.js**: Ensure Node.js (v18+) is installed.
3. **Python**: Ensure Python (3.9+) is installed.

### Setup and Execution

1. **Clone the repository** (or navigate to the project folder).
2. **Install and run all services** in one command:
   ```bash
   ./setup_and_run.bat
   ```
   *This script automatically opens VS Code at the project root, starts the Spring Boot backend, and installs dependencies and starts the React frontend dev server.*

### Running Services Manually

If you prefer to start the services in separate terminals, follow these steps:

#### 1. AI Service (Port 5000)
```bash
cd ai-service
python -m venv venv
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
python app.py
```

#### 2. Backend Service (Port 8085)
```bash
cd backend
.\apache-maven-3.9.6\bin\mvn.cmd spring-boot:run
```

#### 3. Frontend Dev Server (Port 3001)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔗 Port Mappings & API endpoints

| Component | Dev URL | Port |
| :--- | :--- | :--- |
| **Frontend UI** | `http://localhost:3001` | `3001` |
| **Backend API** | `http://localhost:8085/api` | `8085` |
| **H2 Console** | `http://localhost:8085/h2-console` | `8085` |
| **AI Service** | `http://localhost:5000` | `5000` |

---

## 🧪 Integration Verification

To test that all services are online and communicating correctly, run:
```bash
python temp_api_check.py
```
This utility validates:
* User Authentication & JWT creation
* Dashboard summary generation
* AI-based recommendations
* Stability score and forecasting API connections
