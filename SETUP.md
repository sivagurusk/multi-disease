# Quick Setup & Testing Guide

## Local Development

### Prerequisites
- Node.js v14+
- Python 3.7+ with scikit-learn, pandas, joblib
- (Optional) SMTP server for email features

### Step 1: Install Dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### Step 2: Set Up Environment Variables (.env in server/)

```
JWT_SECRET=your-secret-key-here
PORT=5000

# Optional SMTP for email sending
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

### Step 3: Start the Application

Terminal 1 (Backend):
```bash
cd server
node app.js
# Should log: "Server started on port 5000"
```

Terminal 2 (Frontend):
```bash
cd client
npm start
# Opens http://localhost:3000
```

### Step 4: Test the Flow

1. **Register** – Create an account (any credentials work for dev)
2. **Predict** – Fill out the form:
   - Enter patient details
   - Search or select symptoms (or use disease accordion)
   - Review and submit

> You can also use the **Diabetes** or **Heart Disease** buttons in the top navigation bar for a quick risk evaluation; select any applicable symptoms then click "Evaluate Risk" to see a low/medium/high level and get suggested next steps.

3. **Results** – View prediction with charts and options
4. **Export** – Download PDF, JSON, CSV
5. **Email** (if SMTP configured) – Send report to email address via modal dialog
6. **Report Outcome** – Submit actual diagnosis in modal to help train model
7. **History** – View past predictions and email history CSV

---

## Email Configuration (Optional)

### Gmail Example
1. Enable 2-factor authentication on your Google account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Set in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=<your-16-digit-app-password>
   SMTP_FROM=your-email@gmail.com
   ```

### Other Providers
- **Outlook**: smtp.office365.com:587
- **SendGrid**: smtp.sendgrid.net:587 (user: `apikey`, pass: API key)
- **Mailgun**: smtp.mailgun.org:587

---

## Deployment Checklist

### Server
- [ ] Build models: `npm run train` (if needed)
- [ ] Set `JWT_SECRET` in production `.env`
- [ ] Configure SMTP if email required
- [ ] Use process manager (pm2, systemd, docker)
- [ ] Expose on port 5000 (or configured PORT)

### Client
- [ ] Run `npm run build`
- [ ] Serve `build/` folder via nginx/Apache or static host (Netlify, Vercel, S3)
- [ ] (If hosted separately) Set `REACT_APP_API_URL=https://api.yourdomain.com`

### Database (if using)
- [ ] Configure MongoDB connection string
- [ ] Set up indexes on user collection

---

## Troubleshooting

### "Prediction not found (404)"
- Is server running? Check port 5000
- Does client proxy match server port? (`package.json` → `"proxy"`)
- On mobile/remote: set `REACT_APP_API_URL=http://<server-ip>:5000`

### "Email send failed"
- Check SMTP credentials in `.env`
- Verify firewall allows port 587 (SMTP)
- For Gmail: use app password, not account password

### "Models not found"
- Ensure `server/ml/models/` contains `.pkl` files
- Run `cd server && python ml/train.py`

### "Symptoms not loading"
- Check `server/ml/dataset.csv` exists
- Verify `/api/predict/symptoms` returns data: `curl http://localhost:5000/api/predict/symptoms` (it now returns objects with optional id field; the client fetches these ids but does **not** display them in the checklist)
- Note: the UI requires at least two symptoms before allowing a prediction to be submitted; this validation happens client‑side.

---

## File Structure Summary

```
multi-disease/
├── client/                    # React app
│   ├── src/components/
│   │   ├── ResultPage.js      # Result display + modals
│   │   ├── History.js         # History list + modals
│   │   ├── PredictForm.js     # Multi-step form + disease accordion
│   │   └── ...css files
│   └── package.json
├── server/
│   ├── app.js                 # Express server
│   ├── routes/
│   │   ├── predict.js         # Prediction & symptom endpoints
│   │   ├── pdf.js             # PDF generation + email
│   │   ├── history.js         # History email endpoint
│   │   └── auth.js            # JWT login/register
│   ├── ml/
│   │   ├── predict.py         # Prediction script
│   │   ├── train.py           # Model training
│   │   ├── models/            # .pkl files, metrics.json
│   │   └── dataset.csv        # Training data
│   └── package.json
└── README.md
```

---

## Next Steps

- **Add more diseases**: Expand `server/ml/dataset.csv` and retrain
- **Improve UI**: Polish CSS, add dark mode, animations
- **Mobile app**: Use React Native
- **Admin panel**: Dashboard to manage users, view analytics
- **API docs**: Generate OpenAPI/Swagger docs
- **CI/CD**: GitHub Actions, GitLab CI for auto-deployment

