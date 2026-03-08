# Feature Map & Architecture Overview

## User Journey

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │
       ▼
   ┌─────────────────────┐
   │  Register/Login     │
   │  (JWT Auth)         │
   └────────────┬────────┘
                │
       ┌────────▼────────┐
       │ Multi-Step Form │
       │ ┌────────────┐  │
       │ │ Step 1:    │  │
       │ │ Demographics│  │
       │ └────────────┘  │
       │ ┌────────────┐  │
       │ │ Step 2:    │  │
       │ │ Symptoms   │  │
       │ │ + Accordion│  │
       │ │ + Search   │  │
       │ └────────────┘  │
       │ ┌────────────┐  │
       │ │ Step 3:    │  │
       │ │ Review     │  │
       │ └────────────┘  │
       └────────┬───────┘
                │
                ▼
        ┌──────────────────┐
        │ ML Prediction    │
        │ (Python script)  │
        │ - AdaBoost       │
        │ - GBM Ensemble   │
        └────────┬─────────┘
                 │
         ┌───────▼────────┐
         │ Result Page    │
         ├────────────────┤
         │• Prediction    │
         │• Risk Badge    │
         │• Treatment     │
         │• Charts:       │
         │  - Probability │
         │  - Symptoms    │
         │• Next Steps    │
         └────────┬───────┘
                 │
         ┌──────────────┴──────────────┐
         │      Export Options          │
         ├──────────────┬───────────────┤
         │              │               │
         ▼              ▼               ▼
    ┌────────┐    ┌────────┐    ┌────────┐
    │ PDF    │    │ JSON   │    │ CSV    │
    │ Report │    │ Export │    │ Export │
    └────────┘    └────────┘    └────────┘
         │              │               │
         └──────┬───────┴───────┬───────┘
                │               │
    ┌───────────▼─────────┐   ┌─▼──────────────────┐
    │ Email Modal Dialog  │   │ Share to Clipboard │
    │ (if SMTP config)    │   └────────────────────┘
    └─────────────────────┘
         │
    ┌────▼─────────────┐
    │ Report Diagnosis │
    │ Modal Dialog     │ ──────────────┐
    └──────────────────┘               │
         │                             │
         └──────────────┬──────────────┘
                        │
                ┌───────▼────────┐
                │ History List   │
                ├────────────────┤
                │ • Re-run       │
                │ • Charts       │
                │ • Email        │
                │ • Export       │
                │ • Clear        │
                └────────────────┘
```

---

## Component Architecture

```
App.js
├── useContext(AuthContext)
├── useRoutes() → 
│   ├── /               → PredictForm
│   ├── /loading        → LoadingPage
│   ├── /results        → ResultPage
│   ├── /history        → History
│   ├── /login          → Login
│   ├── /register       → Register
│   └── /* (not found)  → 404
│
├── Navigation (Header)
│
└── Protected Routes (token required)

PredictForm.jsx
├── State: [selected, step, userInfo, diseases, symptoms]
├── Effects: [fetchSymptoms(), fetchDiseases()]
├── Render:
│   ├── Stepper (1, 2, 3)
│   ├── Demographics Form (Step 1)
│   ├── Symptom List (Step 2)
│   │   ├── Search/Filter Input
│   │   └── Disease Accordion
│   │       └── "Add All" Button
│   ├── Review (Step 3)
│   └── Navigation (Back, Next, Submit)
└── Sidebar: Prediction Summary

ResultPage.jsx
├── State: [showEmailModal, emailInput, showDiagnosisModal, diagnosisInput]
├── Data: [result, userInfo, symptoms]
├── Modals:
│   ├── Email Report Modal
│   └── Diagnosis Report Modal
├── Render:
│   ├── Header (Patient Info)
│   ├── Prediction Card
│   ├── Treatment Card
│   ├── Features List
│   ├── Symptom Heatmap
│   ├── Charts
│   │   ├── ProbabilityChart (Bar graph)
│   │   └── SymptomChart (Horizontal bar)
│   ├── Next Steps List
│   └── Action Buttons
│       ├── New Prediction
│       ├── Download Report (PDF)
│       ├── Download JSON
│       ├── Download CSV
│       ├── Email Report [→ Modal]
│       ├── Report Diagnosis [→ Modal]
│       ├── Save Analysis
│       └── Share Results
└── Modals with Input Fields

History.jsx
├── State: [history, showEmailModal, emailInput]
├── Effects: [loadFromLocalStorage()]
├── Render:
│   ├── HistoryChart (Timeline)
│   ├── Action Buttons
│   │   ├── Clear History
│   │   ├── Download JSON
│   │   ├── Download CSV
│   │   └── Email History [→ Modal]
│   ├── History List
│   │   └── Per Entry:
│   │       ├── Patient Name
│   │       ├── Date
│   │       ├── Disease
│   │       ├── Risk Level
│   │       └── Re-run Button
│   └── Email Modal
└── Keyboard: Enter to submit
```

---

## API Contract

### Authentication Routes
```
POST   /api/auth/register
  Body: { email, password }
  Response: { token, msg }

POST   /api/auth/login
  Body: { email, password }
  Response: { token, msg }
```

### Prediction Routes
```
GET    /api/predict/symptoms
  Headers: (none required)
  Response: { symptoms: [strings] }

GET    /api/predict/diseases
  Headers: { Authorization: Bearer TOKEN }
  Response: { diseases: [{name, symptoms}] }

POST   /api/predict
  Headers: { Authorization: Bearer TOKEN }
  Body: { symptoms: [], name, age, gender, contact }
  Response: { 
    prediction_adaboost, accuracy_adaboost, risk_level,
    recommendation, treatment, next_steps, 
    probability_distribution: [{disease, probability}]
  }
```

### Report Routes
```
POST   /api/pdf
  Headers: { Authorization: Bearer TOKEN }
  Body: { name, age, gender, contact, symptoms, prediction, accuracy, risk, etc }
  Response: PDF file (blob)

POST   /api/pdf/send
  Headers: { Authorization: Bearer TOKEN }
  Body: { to (email), ...reportData }
  Response: { success: true }

POST   /api/history/send
  Headers: (none)
  Body: { to (email), history: [] }
  Response: { success: true }
```

### Training Route
```
POST   /api/train/add
  Headers: { Authorization: Bearer TOKEN }
  Body: { disease: string, symptoms: [] }
  Response: { msg: "Sample added. Retraining in background." }
```

---

## Data Models

### User
```javascript
{
  _id: ObjectId,
  email: string,
  password: hashed string,
  createdAt: timestamp
}
```

### Prediction Result
```javascript
{
  symptoms: [strings],
  prediction_adaboost: string,        // Disease name
  accuracy_adaboost: number,          // 0-1
  risk_level: "Low" | "Medium" | "High",
  recommendation: string,
  treatment: string,
  next_steps: [strings],
  probability_distribution: [
    { disease: string, probability: number }
  ]
}
```

### History Entry
```javascript
{
  userInfo: { name, age, gender, contact },
  result: {prediction_adaboost, risk_level, acc...},
  symptoms: [strings],
  date: ISO string,
  id: auto-generated
}
```

---

## File Size Analysis

| Component | Size | Impact |
|-----------|------|--------|
| React/ReactDOM | 40KB | Core framework |
| Chart.js | 25KB | Chart rendering |
| Axios | 12KB | HTTP client |
| Other deps | 20KB | Utils, routing |
| App code | 25KB | Custom components |
| CSS/media | 10KB | Styling |
| **Total (gzipped)** | **141KB** | ✅ Excellent |

---

## State Management Flow

```
┌──────────────────────────────────────┐
│  AuthContext (JWT Token)             │
├──────────────────────────────────────┤
│ • token (string)                     │
│ • login(email, password)             │
│ • logout()                           │
│ • register(email, password)          │
└──────────┬───────────────────────────┘
           │
    ┌──────▼────────┐
    │ Protected     │
    │ Routes        │
    │ (check token) │
    └──────┬────────┘
           │
    ┌──────▼──────────────────────┐
    │ Local State per Component   │
    ├─────────────────────────────┤
    │ • PredictForm: selected,    │
    │   step, userInfo, diseases  │
    │ • ResultPage: email/diag    │
    │   modal state               │
    │ • History: email modal,     │
    │   sorted history            │
    └─────────────────────────────┘
           │
    ┌──────▼──────────────────────┐
    │ localStorage & sessionStorage│
    ├─────────────────────────────┤
    │ • token (session)           │
    │ • history (localStorage)    │
    └─────────────────────────────┘
```

---

## Modal Flow Diagram

```
User clicks "Email Report"
         │
         ▼
showEmailModal = true
         │
         ▼
┌─────────────────────────────┐
│ Modal renders with:         │
│ - Input field (auto-focus)  │
│ - Cancel button             │
│ - Send button               │
└────────┬────────────────────┘
         │
    ┌────┴──────┐
    │            │
Cancel       Enter or
(setState    Click Send
false)       │
│            ▼
│       Validate email
│            │
│       ┌────┴────┐
│       │          │
│     Invalid    Valid
│       │          │
│    Alert      API Call
│       │       /api/pdf/send
│       │          │
│       │      ┌────┴────┐
│       │      │          │
│       │   Success    Error
│       │      │          │
│       │    Alert      Alert
│       │      │          │
│       │  setState(false)│
│       │      │      setState(false)
│       │      │          │
└───────┴──────▼──────────┘
         │
         ▼
   Modal closes
```

---

## Deployment Architecture

```
                         ┌─────────────────┐
                         │  Domain Name    │
                         │  (yourdomain)   │
                         └────────┬────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
            ┌───────▼────┐  ┌──────▼──┐  ┌──────▼──┐
            │ Netlify    │  │ Heroku  │  │ Docker  │
            │ (Client)   │  │ (Server)│  │ Compose │
            │ build/     │  │ app.js  │  │ (Dev)   │
            └──────┬─────┘  └──┬──────┘  └──────┬──┘
                   │           │             │
                   └───────────┼─────────────┘
                               │
                        ┌──────▼──────┐
                        │  HTTPS      │
                        │  Proxy      │
                        └──────┬──────┘
                               │
                   ┌───────────┼───────────┐
                   │           │           │
            ┌──────▼──┐  ┌──────▼──┐  ┌───▼────┐
            │ JWT Auth│  │  ML     │  │  SMTP  │
            │ Verify  │  │ Predict │  │ Email  │
            │         │  │         │  │ Service│
            └─────────┘  └─────────┘  └────────┘
```

---

## Performance Considerations

1. **Frontend:**
   - Lazy load charts on demand
   - Memoize expensive calculations
   - Use React.memo for chart components
   - Optimize bundle with code splitting (future)

2. **Backend:**
   - Cache disease list (10 min TTL)
   - Reuse DB connections
   - Limit Python process parallelism
   - Queue training jobs with Bull (future)

3. **Network:**
   - Gzip compression (141KB → 141KB)
   - CDN for static assets (future)
   - GraphQL instead of REST (future)

---

## Testing Checklist

```
Frontend
├── Unit Tests (Jest)
│   └── Utility functions (exportUtils.js)
├── Component Tests (React Testing Library)
│   ├── Form validation
│   ├── Modal open/close
│   └── Chart rendering
├── E2E Tests (Cypress)
│   ├── Register → Predict → Results → History
│   ├── Email flow
│   └── Export buttons
└── Manual Tests
    ├── Offline mode
    ├── Mobile responsiveness
    └── Keyboard navigation

Backend
├── Unit Tests (Jest)
│   ├── Auth middleware
│   ├── Prediction logic
│   └── Email formatting
├── Integration Tests
│   ├── /api/predict flow
│   ├── /api/pdf/send SMTP
│   └── /api/train/add retraining
└── Manual Tests
    ├── CORS headers
    ├── JWT expiration
    └── Error responses
```

