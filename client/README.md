# Multi-Disease Prediction Client

Simple React frontend to register, login, and submit symptoms for disease prediction.

## Setup

```bash
cd client
npm install
npm start
```

The app assumes the backend server is running on `http://localhost:5000`.

## Flow

2. Register a new user or log in with existing credentials.
3. After authentication, fill in your personal details (name, age, gender, contact) and select symptoms from categorized checklists (respiratory, neurological, metabolic).
4. Click "Predict" and watch the progress indicator.
5. View the result dashboard showing predictions from both models, accuracy meters, risk level and recommended next steps.

The UI uses vibrant colors and motivational styling to encourage health awareness.
