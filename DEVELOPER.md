# Developer Quick Reference

## Component Tree

```
App (Auth wrapper)
├── Login / Register
├── PredictForm
│   ├── Step 1: Demographics
│   ├── Step 2: Symptoms (with accordion + search)
│   └── Step 3: Review
├── LoadingPage (Prediction in progress)
├── ResultPage
│   ├── Charts (Probability + Symptom)
│   └── Modals
│       ├── Email Report Modal
│       └── Diagnosis Report Modal
├── History
│   ├── History List
│   ├── HistoryChart
│   └── Email History Modal
└── Navigation
```

## Key API Endpoints

### Authentication
```
POST /api/auth/register  { email, password }
POST /api/auth/login     { email, password }
```

### Prediction
```
GET  /api/predict/symptoms                      → { symptoms: [] }
GET  /api/predict/diseases                      → { diseases: [{name, symptoms}] }
POST /api/predict        {symptoms, name, age}  → { prediction, accuracy, charts }
```

### Reports
```
POST /api/pdf            {data}                 → PDF file
POST /api/pdf/send       {to, data}             → Send PDF via email
POST /api/history/send   {to, history}          → Send history CSV
```

### Training
```
POST /api/train/add      {disease, symptoms}    → Append & retrain model
```

---

## Common Tasks

### Add a New Component
```bash
# 1. Create component file
touch client/src/components/MyComponent.js

# 2. Create CSS file
touch client/src/components/MyComponent.css

# 3. Import in App.js or parent
import MyComponent from './components/MyComponent';

# 4. Use in JSX
<MyComponent prop1={value} />
```

### Add a New Route
```bash
# 1. Create endpoint in server/routes/myroute.js
const router = express.Router();
router.get('/', (req, res) => res.json({msg: 'test'}));
module.exports = router;

# 2. Register in app.js
app.use('/api/myroute', require('./routes/myroute'));

# 3. Call from client
const res = await axios.get('/api/myroute');
```

### Add SMTP Configuration
```bash
# 1. Set .env variables
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
SMTP_FROM=your-email@gmail.com

# 2. Nodemailer is already imported in routes/pdf.js and routes/history.js
# 3. Test by sending email from ResultPage
```

### Test Offline Mode
```javascript
// In browser DevTools:
// 1. Open Network tab
// 2. Right-click server → Block request URL
// 3. Refresh page
// 4. Form should still show with embedded symptom list
```

---

## Environment Variables

### Server `.env`
```
JWT_SECRET=your-secret-key
PORT=5000
MONGODB_URI=mongodb+srv://...  (optional, for future persistence)

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email@example.com
SMTP_PASS=password
SMTP_FROM=noreply@example.com
```

### Client `.env`
```
REACT_APP_API_URL=http://localhost:5000  (optional, default is relative)
```

---

## File Locations

| File | Purpose |
|------|---------|
| `server/app.js` | Main Express server |
| `server/routes/predict.js` | Prediction endpoints |
| `server/routes/pdf.js` | PDF generation + email |
| `server/routes/history.js` | History email |
| `server/routes/auth.js` | JWT auth |
| `server/ml/predict.py` | ML prediction script |
| `server/ml/train.py` | Model training |
| `client/src/App.js` | Main React component |
| `client/src/components/PredictForm.js` | Form with accordion |
| `client/src/components/ResultPage.js` | Results + modals |
| `client/src/components/History.js` | History + modal |
| `client/src/utils/exportUtils.js` | Export helpers |

---

## Debugging Tips

### Backend
```bash
# Watch logs
cd server && npm run dev

# Check if server is running
curl http://localhost:5000/api/predict/symptoms

# Test prediction
curl -X POST http://localhost:5000/api/predict \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"symptoms":["fever","cough"]}'
```

### Frontend
```javascript
// In browser console:
// Check axios config
console.log(axios.defaults);

// Check local storage
console.log(JSON.parse(localStorage.getItem('history')));

// Check auth token
console.log(localStorage.getItem('token'));
```

### Network
```bash
# Check if port 5000 is listening
netstat -an | grep 5000

# Kill process on port
lsof -ti:5000 | xargs kill -9
```

---

## Performance Tips

1. **Bundle Size** – Client builds to ~141KB gzipped (good!)
2. **API Calls** – Memoize disease list with `useEffect` dependency array
3. **Charts** – Use `react-chartjs-2` for lightweight rendering
4. **Images** – Store in `public/` folder, reference as `/image.png`
5. **CSS** – Keep component-scoped, avoid global styles where possible

---

## Security Checklist

- [ ] Never log sensitive data (passwords, tokens)
- [ ] Always use HTTPS in production
- [ ] Validate user input on both client & server
- [ ] Use strong `JWT_SECRET` (minimum 32 chars)
- [ ] Hash passwords with bcryptjs before storing
- [ ] Protect `/api/train/add` route with auth
- [ ] Rate limit auth endpoints to prevent brute force
- [ ] Store SMTP password in environment, never in code
- [ ] Use secure cookies for auth tokens (over HTTPS)

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/email-modal

# Make changes, test locally
# ...

# Commit with clear message
git add .
git commit -m "Add email modal to ResultPage"

# Push to remote
git push origin feature/email-modal

# Create PR for review
# After approval, merge to main
```

---

## Resources

- [React Docs](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [Nodemailer](https://nodemailer.com)
- [Chart.js](https://www.chartjs.org)
- [EJS Templates](https://ejs.co)
- [JWT Explained](https://jwt.io)

