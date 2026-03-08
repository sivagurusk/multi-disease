import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// use dynamic base URL (override via REACT_APP_API_URL env var) to avoid proxy port issues
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });

const steps = [
  'Analyzing symptoms',
  'Running Adaboost & GBM models',
  'Ensembling results',
  'Calculating risk',
];

function LoadingPage({ token }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, symptoms } = location.state || {};

  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Starting...');

  useEffect(() => {
    if (!userInfo) {
      navigate('/');
      return;
    }
    // perform prediction call
    const fetchPrediction = async () => {
      try {
        const body = { ...userInfo, symptoms };
        const res = await api.post('/predict', body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = res.data;
        // animate progress
        let current = 0;
        const interval = setInterval(() => {
          current += 25;
          setProgress(current);
          const stepIndex = Math.floor(current / 25) - 1;
          setMessage(steps[stepIndex] || 'Finishing...');
          if (current >= 100) {
            clearInterval(interval);
            navigate('/result', { state: { result, userInfo, symptoms } });
          }
        }, 600);
      } catch (err) {
        console.error('prediction error', err);
        let msg = 'Prediction failed, returning to form';
        if (err.response) {
          // provide extra guidance on 404
          if (err.response.status === 404) {
            msg = 'Prediction endpoint not found (404). Is the server running and is the API URL/proxy correct?';
          } else {
            msg += `: ${err.response.data.msg || err.response.data.error || err.response.statusText}`;
          }
          if (err.response.status === 401) {
            msg = 'Authentication error, please log in again.';
            navigate('/login');
            alert(msg);
            return;
          }
        }
        alert(msg);
        navigate('/');
      }
    };
    fetchPrediction();
  }, [navigate, userInfo, symptoms, token]);

  return (
    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ color: '#28a745' }}>AI Diagnostics</h2>
      <h4>In Progress</h4>
      <div style={{ margin: '40px auto', width: 200, height: 200, position: 'relative' }}>
        <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
          <path
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#eee"
            strokeWidth="2"
          />
          <path
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#28a745"
            strokeWidth="2"
            strokeDasharray={`${progress},100`}
          />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <span>{progress}%</span>
        </div>
      </div>
      <p>{message}</p>
      <p>Please wait while our algorithms process your health profile.</p>
      {symptoms && symptoms.length > 0 && (
        <div style={{marginTop:20, textAlign:'left', maxWidth:400, margin:'0 auto'}}>
          <strong>Processing data points:</strong>
          <ul style={{paddingLeft:20, fontSize:12, maxHeight:120, overflowY:'auto', border:'1px solid #ddd', borderRadius:4}}>
            {symptoms.map((s, i) => (
              <li key={i}>{s.replace(/_/g,' ')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LoadingPage;