import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });
import './ResultPage.css';
import ProbabilityChart from './ProbabilityChart';
import SymptomChart from './SymptomChart';
import DiseaseMatchChart from './DiseaseMatchChart';
import { downloadJSON, downloadCSV } from '../utils/exportUtils';

function ResultPage({ token }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, userInfo, symptoms } = location.state || {};
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  if (!result) {
    return (
      <div style={{ padding: 20 }}>
        <p>No prediction data available. Redirecting to the form...</p>
        {setTimeout(() => navigate('/'), 1000)}
      </div>
    );
  }

  const downloadReport = async () => {
    try {
      const body = {
        name: userInfo.name,
        age: userInfo.age,
        gender: userInfo.gender,
        contact: userInfo.contact,
        symptoms,
        prediction: result.prediction || result.prediction_gbm || result.prediction_adaboost,
        accuracy: result.accuracy || result.accuracy_gbm || result.accuracy_adaboost,
        risk: result.risk_level,
        recommendation: result.recommendation,
        probability_distribution: result.probability_distribution,
        next_steps: result.next_steps,
      };
      const res = await api.post('/pdf', body, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${userInfo.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('download error', err);
      alert('Failed to download report');
    }
  };

  // prepare key features list (use provided data or list selected symptoms)
  const keyFeatures = result.key_features || symptoms.map((s) => ({ name: s.replace(/_/g,' '), score: 1 }));
  const probabilityList = result.probability_distribution || [];
  const nextSteps = result.next_steps || [];
  const symptomChartData = symptoms.map(s => ({ name: s.replace(/_/g,' '), value: 1 }));
  const matchChartData = result.match_counts
    ? result.match_counts.map(m => ({ name: m.disease, value: m.match_count }))
    : [];

  const exportJSON = () => {
    downloadJSON({ userInfo, result, symptoms }, `result-${userInfo.name}.json`);
  };

  const exportCSV = () => {
    const row = [
      userInfo.name,
      userInfo.age,
      userInfo.gender,
      userInfo.contact,
      result.prediction || result.prediction_gbm || result.prediction_adaboost,
      result.risk_level,
      Math.round((result.accuracy || result.accuracy_gbm || result.accuracy_adaboost)*100)+'%',
      '"'+symptoms.join(';')+'"',
      // include match counts as semicolon‑separated list disease:count
      result.match_counts
        ? '"' + result.match_counts.map(m=>`${m.disease}:${m.match_count}`).join(';') + '"'
        : ''
    ];
    const header = ['name','age','gender','contact','disease','risk','accuracy','symptoms','matches_per_disease'];
    downloadCSV([row], header, `result-${userInfo.name}.csv`);
  };

  const emailReport = async () => {
    if (!emailInput.trim()) {
      alert('Please enter an email address');
      return;
    }
    try {
      const body = {
        to: emailInput.trim(),
        name: userInfo.name,
        age: userInfo.age,
        gender: userInfo.gender,
        contact: userInfo.contact,
        symptoms,
        prediction: result.prediction || result.prediction_gbm || result.prediction_adaboost,
        accuracy: result.accuracy || result.accuracy_gbm || result.accuracy_adaboost,
        risk: result.risk_level,
        recommendation: result.recommendation,
        probability_distribution: result.probability_distribution,
        next_steps: result.next_steps,
      };
      await api.post('/pdf/send', body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(`Email sent to ${emailInput.trim()}`);
      setShowEmailModal(false);
      setEmailInput('');
    } catch (err) {
      console.error('email send error', err);
      alert('Failed to send email');
    }
  };

  const reportOutcome = async () => {
    if (!diagnosisInput.trim()) {
      alert('Please enter a diagnosis');
      return;
    }
    try {
      await api.post(
        '/train/add',
        { disease: diagnosisInput.trim(), symptoms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Thank you! Sample submitted for retraining.');
      setShowDiagnosisModal(false);
      setDiagnosisInput('');
    } catch (err) {
      console.error('report outcome error', err);
      alert('Failed to submit sample');
    }
  };

  return (
    <div className="result-container">
      <div className="result-header">
        <h2>AI Diagnostics</h2>
        <p><strong>Patient:</strong> {userInfo.name} ({userInfo.age} / {userInfo.gender})</p>
      </div>

      <div className="overview">
        <h3>Primary Prediction</h3>
        <p className="disease-name">{result.prediction || result.prediction_gbm || result.prediction_adaboost}</p>
        <div style={{marginTop: '8px'}}>
          <span className={`risk-badge ${result.risk_level.toLowerCase()}`}>{result.risk_level} Risk</span>
          <span style={{marginLeft: '16px', fontWeight: 600, color: '#333'}}>
            Accuracy: {Math.round((result.accuracy || result.accuracy_gbm || result.accuracy_adaboost) * 100)}%
          </span>
        </div>
          {probabilityList.length > 0 && (
              <div style={{marginTop:10}}>
                <h4>Highest Probability Disease</h4>
                <ul>
                  {(() => {
                    if (probabilityList.length === 0) return null;
                    const maxProb = Math.max(...probabilityList.map(p => p.probability));
                    const topDisease = probabilityList.find(p => p.probability === maxProb);
                    if (!topDisease) return null;
                    const risk_map = {
                      'Common Cold': 'Low',
                      'Allergy': 'Low',
                      'Flu': 'Medium',
                      'Migraine': 'Medium',
                      'Strep Throat': 'Medium',
                      'Asthma': 'Medium',
                      'Hypertension': 'Medium',
                      'Typhoid': 'High',
                      'COVID-19': 'High',
                      'Dengue fever': 'High',
                      'Malaria': 'High',
                      'Tuberculosis': 'High',
                      'Diabetes': 'High',
                      'Pneumonia': 'High',
                      'Severe Infection': 'High',
                      'Heart Attack': 'Critical',
                      'Stroke': 'Critical'
                    };
                    return (
                      <li>
                        <span style={{fontWeight:'bold'}}>{topDisease.disease}</span>: {Math.round(topDisease.probability*100)}% probability
                        <span style={{marginLeft:8, color:'#888'}}>[{risk_map[topDisease.disease] || 'Unknown'} Risk]</span>
                      </li>
                    );
                  })()}
                </ul>
              </div>
          )}
      </div>

      {result.treatment && (
        <div className="treatment">
          <h4>Treatment Suggestions</h4>
          <p>{result.treatment}</p>
        </div>
      )}

      {keyFeatures.length > 0 && (
        <div className="key-features">
          <h4>Key Feature Contributors</h4>
          <ul>
            {keyFeatures.map((f, idx) => (
              <li key={idx}>{f.name} {f.score > 0 ? `+${f.score}` : ''}</li>
            ))}
          </ul>
        </div>
      )}

      {symptoms && symptoms.length > 0 && (
        <div className="symptom-heatmap">
          {symptoms.map((s, i) => (
            <div key={i}>{s.replace(/_/g,' ')}</div>
          ))}
        </div>
      )}

      {probabilityList.length > 0 && (
        <div className="probability-distribution">
          <ProbabilityChart distribution={probabilityList} />
        </div>
      )}

      {matchChartData.length > 0 && (
        <div className="probability-distribution">
          <DiseaseMatchChart data={matchChartData.slice(0,10)} />
        </div>
      )}

      {symptomChartData.length > 0 && (
        <div className="probability-distribution">
          <SymptomChart data={symptomChartData} />
        </div>
      )}

      {nextSteps.length > 0 && (
        <div className="next-steps">
          <h4>Personalized Next Steps</h4>
          <ul>
            {nextSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="buttons-group">
        <button onClick={() => navigate('/')} className="btn-primary">New Prediction</button>
        <button onClick={downloadReport} className="btn-secondary">Download Report</button>
        <button onClick={exportJSON} className="btn-secondary">Download JSON</button>
        <button onClick={exportCSV} className="btn-secondary">Download CSV</button>
        {matchChartData.length > 0 && (
          <button
            onClick={() => {
              const rows = matchChartData.map(m => [m.name, m.value]);
              downloadCSV(rows, ['disease','matches'], 'matches.csv');
            }}
            className="btn-secondary"
          >
            Download Match Data
          </button>
        )}
        <button onClick={() => setShowEmailModal(true)} className="btn-secondary">Email Report</button>
        <button onClick={() => setShowDiagnosisModal(true)} className="btn-secondary">Report Actual Diagnosis</button>
        <button onClick={() => {
            const history = JSON.parse(localStorage.getItem('history') || '[]');
            history.push({ userInfo, result, symptoms, date: new Date().toISOString() });
            localStorage.setItem('history', JSON.stringify(history));
            alert('Analysis saved to history');
          }}
          className="btn-warning">Save Analysis</button>
        <button onClick={() => {
            const txt = `Result for ${userInfo.name}: ${result.prediction_adaboost} (risk ${result.risk_level}, accuracy ${Math.round(result.accuracy_adaboost*100)}%)`;
            navigator.clipboard.writeText(txt).then(() => alert('Copied to clipboard')); 
          }}
          className="btn-info">Share Results</button>
      </div>

      {/* Modal for email submission */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Email Report</h3>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Enter the email address where you'd like to receive the report PDF.</p>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && emailReport()}
                autoFocus
                className="modal-input"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEmailModal(false)} className="modal-btn-cancel">Cancel</button>
              <button onClick={emailReport} className="modal-btn-submit">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for diagnosis submission */}
      {showDiagnosisModal && (
        <div className="modal-overlay" onClick={() => setShowDiagnosisModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Confirmed Diagnosis</h3>
              <button className="modal-close" onClick={() => setShowDiagnosisModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>If you have received a confirmed diagnosis, please enter it below. This helps improve our predictive models.</p>
              <input
                type="text"
                placeholder="e.g., Pneumonia, Diabetes, Flu"
                value={diagnosisInput}
                onChange={(e) => setDiagnosisInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && reportOutcome()}
                autoFocus
                className="modal-input"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowDiagnosisModal(false)} className="modal-btn-cancel">Cancel</button>
              <button onClick={reportOutcome} className="modal-btn-submit">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultPage;