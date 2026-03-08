# Multi-Disease Prediction Server

This Node/Express backend provides user authentication, connects to MongoDB, and runs machine learning models to predict diseases based on user-reported symptoms.

## Setup

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```
2. **Python environment**
   A Python interpreter (3.8+) is required to train and run the models. Create a venv and install packages:
   ```bash
   cd server/ml
   python -m venv venv
   venv\Scripts\activate    # Windows
   pip install -r requirements.txt
   ```
3. **Configure environment variables**
   Copy `.env.example` to `.env` or edit `.env` and set `MONGO_URI` and `JWT_SECRET`.

## Training the models

The `ml/train.py` script reads `ml/dataset.csv`, trains AdaBoost and GradientBoosting classifiers, prints accuracy, and saves the models and label encoder in `ml/models/`.

```bash
npm run train
# or manually:
# python ml/train.py
```

You can inspect the accuracy in the console output; it will also show classification reports.

## Prediction

When the server receives a POST request to `/api/predict` with a JSON body like:

```json
{
  "symptoms": ["fever","cough"]
}
```

it executes `ml/predict.py` to return predictions from both models.

## Running the server

```bash
npm run dev   # uses nodemon for automatic restart
```

The server listens on port defined in `.env` (default 5000).

### PDF generation
A new endpoint `GET /api/pdf?name=XYZ` returns a PDF document using the design from `Selection.pdf` but with the provided user name inserted. The server uses an HTML template (`pdf/template.html`), EJS for rendering, and `html-pdf` to convert to PDF. Install dependencies and restart the server to use this feature.
If you see an `EADDRINUSE` error, the server will now automatically try the next port number (e.g. 5001, 5002, …) until it finds a free one. You can still manually free the port (`taskkill /F /IM node.exe` on Windows) or set `PORT` in `.env` if you prefer a specific value.

## API Routes

- `POST /api/auth/register` – name, email, password
- `POST /api/auth/login` – email, password
- `POST /api/predict` – symptoms array (token not required in this example but you may protect it with JWT middleware)
- `POST /api/train/add` – provide `{ disease: string, symptoms: string[] }` to append a labeled example to `ml/dataset.csv`; the server will trigger retraining in the background.

You can also regenerate the whole dataset with `python ml/rebuild_dataset.py` if you need synthetic samples for testing.



