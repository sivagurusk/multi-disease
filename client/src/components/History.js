import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HistoryChart from './HistoryChart';
import { downloadJSON, downloadCSV } from '../utils/exportUtils';
import './History.css';

function History() {
  const [history, setHistory] = useState([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('history') || '[]');
    // sort newest first
    stored.sort((a,b) => new Date(b.date) - new Date(a.date));
    setHistory(stored);
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear all history?')) {
      localStorage.removeItem('history');
      setHistory([]);
    }
  };

  const handleJSONExport = () => {
    downloadJSON(history, 'history.json');
  };

  const handleCSVExport = () => {
    if (history.length === 0) return;
    const header = ['name','date','disease','risk','accuracy','symptoms'];
    const rows = history.map(h => [
      h.userInfo.name,
      h.date,
      h.result.prediction_adaboost,
      h.result.risk_level,
      Math.round(h.result.accuracy_adaboost*100)+'%',
      '"'+h.symptoms.join(';')+'"'
    ]);
    downloadCSV(rows, header, 'history.csv');
  };

  const handleReRun = (entry) => {
    navigate('/loading', { state: { userInfo: entry.userInfo, symptoms: entry.symptoms } });
  };

  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding:20, fontFamily:'Arial, sans-serif' }}>
      <h2>Prediction History</h2>
      {history.length > 0 && <HistoryChart history={history} />}
      {history.length === 0 ? (
        <p>No past analyses saved.</p>
      ) : (
        <div>
          <div style={{marginBottom:20}}>
            <button onClick={handleClear} style={{marginRight:8}}>Clear History</button>
            <button onClick={handleJSONExport} style={{marginRight:8}}>Download JSON</button>
            <button onClick={handleCSVExport} style={{marginRight:8}}>Download CSV</button>
            <button onClick={() => setShowEmailModal(true)}>Email Report</button>
          </div>
          <ul style={{listStyle:'none', padding:0}}>
            {history.map((h, idx) => (
              <li key={idx} style={{border:'1px solid #ccc', borderRadius:4, padding:10, marginBottom:10}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <strong>{h.userInfo.name}</strong> – {new Date(h.date).toLocaleString()}
                    <div>Disease: {h.result.prediction_adaboost} ({h.result.risk_level} risk)</div>
                  </div>
                  <div>
                    <button onClick={() => handleReRun(h)} style={{marginRight:8}}>Re-run</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal for email submission */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Email History</h3>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Enter the email address where you'd like to receive your history CSV.</p>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    (async () => {
                      if (!emailInput.trim()) return;
                      try {
                        await fetch('/api/history/send', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ to: emailInput.trim(), history }),
                        });
                        alert('Email sent');
                        setShowEmailModal(false);
                        setEmailInput('');
                      } catch (err) {
                        alert('Failed to send email');
                      }
                    })();
                  }
                }}
                autoFocus
                className="modal-input"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowEmailModal(false)} className="modal-btn-cancel">Cancel</button>
              <button onClick={async () => {
                if (!emailInput.trim()) {
                  alert('Please enter an email address');
                  return;
                }
                try {
                  await fetch('/api/history/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to: emailInput.trim(), history }),
                  });
                  alert('Email sent');
                  setShowEmailModal(false);
                  setEmailInput('');
                } catch (err) {
                  alert('Failed to send email');
                }
              }} className="modal-btn-submit">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
