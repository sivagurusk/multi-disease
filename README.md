<<<<<<< HEAD
# multi-disease
=======
# Multi-Disease Prediction Application

This workspace contains a full-stack application for predicting diseases based on symptom checklists.

## Project Structure

- **client/** - React frontend
- **server/** - Node/Express backend with ML integration
- **server/ml** - Python scripts, dataset, trained models

## Running Locally

1. Start the backend (ensure MongoDB is running and accessible):
   ```bash
   cd server
   npm install
   node app.js
   ```
   The server must be up before attempting to register or login; connection refused errors will otherwise occur.
2. Start the frontend (in another terminal):
   ```bash
   cd client
   npm install
   npm start
   ```
   - The app makes all requests to `/api/*`; in development CRA proxies these to `http://localhost:5000` (see `proxy` in package.json).
   - To run the front-end from another device, set `REACT_APP_API_URL` or modify `axios.defaults.baseURL`:
     ```bash
     REACT_APP_API_URL=http://<host-ip>:5000 npm start
     ```

3. Register/log in with any credentials to obtain a JWT. Use the form to make predictions.

## Features

### Prediction Workflow
1. **Register/Login** – JWT authentication
2. **Multi-Step Form** – Patient demographics, symptom checklist (with search/filter), review
3. **Quick Assessments** – Navigation bar links for Diabetes and Heart Disease provide targeted symptom checklists (20+ items each), risk levels (low/medium/high), and next‑step suggestions
3. **Disease Grouping** – When logged in, symptoms are organized by disease with "add all" shortcuts
4. **Minimum Symptoms** – The form now enforces selecting at least two symptoms before submitting; this helps avoid misleading predictions from underspecified input.
5. **Symptom Search / Codes** – Type to filter the checklist dynamically; you can also supply numeric symptom codes (1‑520) instead of text and they will be converted server‑side. The UI hides these numeric IDs so the list remains clean – only the symptom names are shown.
5. **Offline Fallback** – If API unavailable, embedded symptom list is used

### Results & Reports
1. **Detailed Results Page**
   - Primary prediction with confidence (accuracy %)
      - Risk level badge (low/medium/high)
   - Treatment suggestions
   - Key feature contributors
   - Symptom list & heatmap
   - Probability distribution chart (top diseases)
   - Symptom-based bar chart
   - Personalized next steps

2. **Export & Sharing**
   - **Download Report** – 4-page PDF with all prediction details
   - **Download JSON/CSV** – Raw data export
   - **Email Report** – Opens modal to send PDF via server email (requires SMTP config)
   - **Report Actual Diagnosis** – Opens modal to submit confirmed diagnosis for model retraining
   - **Save Analysis** – Stores result in browser localStorage for history
   - **Share Results** – Copies summary to clipboard

### Prediction History
- **View Past Analyses** – Browse all saved predictions with patient name, date, disease, risk
- **Re-run** – Run the same symptoms through the model again
- **Charts** – Visualize trend of predictions over time
- **Bulk Export** – Download entire history as JSON or CSV
- **Email History** – Send history CSV via backend email (requires SMTP config)
- **Clear History** – Remove all stored analyses

### UI/UX Enhancements
- **Modal Dialogs** – Clean, animated modals for email and diagnosis submission (no `prompt()` hacks)
- **Stepper Form** – Visual progress indicator for multi-step prediction form
- **Error Handling** – Clear messages for network issues (404, auth failures, etc.)
- **Responsive Design** – Works on desktop and mobile (touch-friendly buttons)
- **Keyboard Navigation** – Press Enter in modal inputs to submit
- **Auto-focus** – Modal inputs auto-focus for quick entry

## Environment Variables

- `JWT_SECRET` - secret used by the server to sign JWTs (set in `.env`).
- `REACT_APP_API_URL` (optional) - base URL for API requests from the client.
- **SMTP settings** (optional) for the new email feature:
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` ("true"/"false"),
  - `SMTP_USER`, `SMTP_PASS` (for authenticated servers),
  - `SMTP_FROM` (sender address, defaults to `no-reply@example.com`).
  If these variables are configured, clicking **Email Report** in the UI will post the PDF to the backend which will send it using nodemailer.

## Deployment Notes

- Build the client with `npm run build` and serve the `build/` folder from any static host.
- The server can be deployed to services like Heroku, AWS EC2, etc. Ensure `JWT_SECRET` is configured and the ML model files are present.

- Use process managers (pm2, systemd) to keep the server running.
- If you add the email transport, install the dependency with `npm install nodemailer` in the `server` directory.

## Offline Support

The client contains an embedded symptom list. If the API cannot be reached, the checklist will still appear, ensuring users can interact with the form even in offline/test environments.

## Export & Reporting

- Results can be downloaded as PDF/JSON/CSV or emailed (server‑side mail is available when SMTP config is set).  After receiving a prediction you can click **Report Actual Diagnosis** to send a confirmed label back to the server; the `/api/train/add` endpoint will append the example and retrain the models asynchronously.
- History can be exported, visualised with a chart, or emailed as a CSV attachment using the `/api/history/send` endpoint.

## Styling & UX

Basic CSS is applied for readability; adjust `client/src/components/*.css` for further polish. Modal styles are unified across components.

---

Feel free to extend features or integrate additional ML models.
>>>>>>> 25babfe (Initial commit)
