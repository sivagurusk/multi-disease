import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });
import { useNavigate } from 'react-router-dom';
import './PredictForm.css';
import DiseaseMatchChart from './DiseaseMatchChart';

// lists retrieved from server
// symptom list will be built dynamically from diseases endpoint

// offline symptom list used when API unavailable
const OFFLINE_SYMPTOMS = [
  'fever','cough','headache','sore_throat','shortness_of_breath',
  'chest_pain','fatigue','high_blood_sugar','frequent_urination',
  'chills','unexplained_weight_loss','excessive_sweating','phlegm_production',
  'known_high_bp','heart_palpitations','swollen_ankles_feet','seizures',
  'dizziness','confusion_memory_loss','numbness_tingling','increased_thirst',
  'increased_hunger','slow_wound_healing','painful_urination','blood_in_urine',
  'nausea','vomiting','diarrhea','constipation','abdominal_pain','joint_pain',
  'morning_stiffness','muscle_aches','back_pain','skin_rash','yellowing_skin',
  'itching','skin_lesions','blurred_vision','runny_nose','hearing_loss','ear_pain',
  'anxiety','mood_swings','depressed_mood','insomnia'
];

function PredictForm({ token }) {
  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({ name:'', age:'', gender:'', contact:'' });
  const [diseases, setDiseases] = useState([]);
  const [symptomsList, setSymptomsList] = useState([]); // will hold objects {name,id?} or plain strings for backwards compatibility
  const [openDisease, setOpenDisease] = useState(null);
  const [symFilter, setSymFilter] = useState('');
  const [symptomError, setSymptomError] = useState(null);
  const [loadingSymptoms, setLoadingSymptoms] = useState(false);
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = demographics, 2 = symptoms, 3 = review
  const [matchData, setMatchData] = useState([]);

  // fetch unauthenticated symptom list and return it
  const fetchSymptoms = async () => {
    setLoadingSymptoms(true);
    try {
      const res = await api.get('/predict/symptoms');
      const raw = res.data.symptoms || [];
      // endpoint returns objects {name,id} when available, but fall back gracefully
      const entries = raw.map((s) => {
        if (typeof s === 'string') return { name: s };
        return { name: s.name || '', id: s.id || null };
      });
      const filtered = entries
        .map((e) => ({ ...e, name: e.name.trim() }))
        .filter((e) => e.name && e.name.toLowerCase() !== 'disease');
      setSymptomError(null);
      // sort by name for consistency
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    } catch (e) {
      console.warn('Could not fetch symptoms', e);
      setSymptomError('Unable to load symptom list');
      return [];
    } finally {
      setLoadingSymptoms(false);
    }
  };

  // load diseases if token available and merge with given symptom array
  const fetchDiseases = async (baseSymptoms) => {
    try {
      const res = await api.get('/predict/diseases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = res.data.diseases || [];
      setDiseases(list);
      // normalize any objects to just the name string
      const names = baseSymptoms.map((b) => (typeof b === 'string' ? b : b.name));
      const all = new Set(names);
      list.forEach((d) => d.symptoms.forEach((s) => all.add(s.trim())));
      // build object array; try to preserve ids from original base if available
      const reverseMap = {};
      // if we loaded id-coded baseSymptoms earlier they won't have id; only mapping from /symptoms
      // so we rebuild by reading symptom list from server again (since baseSymptoms came from fetchSymptoms)
      if (Array.isArray(baseSymptoms) && baseSymptoms.length > 0 && baseSymptoms[0].id !== undefined) {
        baseSymptoms.forEach((e) => { if (e.id) reverseMap[e.name] = e.id; });
      }
      const result = Array.from(all).map((name) => ({ name, id: reverseMap[name] || null }));
      result.sort((a, b) => a.name.localeCompare(b.name));
      setSymptomsList(result);
    } catch (e) {
      console.warn('Could not fetch diseases', e);
    }
  };

  useEffect(() => {
    const load = async () => {
      let base = await fetchSymptoms();
      if (!base || base.length === 0) {
        // use offline fallback
        base = OFFLINE_SYMPTOMS.map((n) => ({ name: n }));
        setSymptomError('Using offline symptom list');
        setSymptomsList(base);
      }
      if (token) await fetchDiseases(base);
    };
    load();
  }, [token]);

  // recompute disease matches any time selected or diseases list change
  useEffect(() => {
    if (!diseases || diseases.length === 0) {
      setMatchData([]);
      return;
    }
    const data = diseases.map((d) => {
      const count = d.symptoms.filter((s) => selected.includes(s.trim())).length;
      return { name: d.disease, value: count };
    });
    // sort descending
    data.sort((a, b) => b.value - a.value);
    setMatchData(data);
  }, [selected, diseases]);

  const toggleSymptom = (symptom) => {
    setSelected((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((u) => ({ ...u, [name]: value }));
  };

  const MIN_SYMPTOMS = 2; // require at least this many symptoms for a reasonable prediction

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selected.length < MIN_SYMPTOMS) {
      alert(
        `Please select at least ${MIN_SYMPTOMS} symptoms for a reliable prediction.`
      );
      return;
    }
    setLoading(true);
    setResult(null);
    navigate('/loading', { state: { userInfo, symptoms: selected } });
  };

  const canProceedToSymptoms = () => {
    return userInfo.name && userInfo.age && userInfo.gender && userInfo.contact;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h4 className="section-title">Patient Demographics</h4>
            <div className="patient-info">
              <div>
                <label>Full Name:</label>
                <input name="name" value={userInfo.name} onChange={handleUserChange} required />
              </div>
              <div>
                <label>Age:</label>
                <input name="age" type="number" value={userInfo.age} onChange={handleUserChange} required />
              </div>
              <div>
                <label>Gender:</label>
                <select name="gender" value={userInfo.gender} onChange={handleUserChange} required>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label>Contact Details:</label>
                <input name="contact" value={userInfo.contact} onChange={handleUserChange} required />
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <h4 className="section-title">Comprehensive Symptom Checklist</h4>
            {symptomError && <p style={{color:'red'}}>{symptomError}</p>}
            {symptomsList.length === 0 && !symptomError && (
              <p>{loadingSymptoms ? 'Loading symptoms…' : 'No symptoms available'}</p>
            )}

            {/* search/filter field */}
            {symptomsList.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <input
                  placeholder="Search symptoms..."
                  value={symFilter}
                  onChange={(e) => setSymFilter(e.target.value.toLowerCase())}
                  style={{ width: '100%', padding: 6 }}
                />
              </div>
            )}

            {/* disease accordion if available */}
            {diseases.length > 0 && (
              <div className="disease-list">
                <h5>Symptoms grouped by disease (click to expand)</h5>
                {diseases.map((d) => (
                  <div key={d.name} className="disease-group">
                    <div
                      className="disease-header"
                      onClick={() => setOpenDisease(openDisease === d.name ? null : d.name)}
                    >
                      {d.name}
                      {(() => {
                        const count = d.symptoms.filter(s => selected.includes(s.trim())).length;
                        return count ? ` (${count})` : '';
                      })()}
                      <span style={{ float: 'right' }}>{openDisease === d.name ? '-' : '+'}</span>
                    </div>
                    {openDisease === d.name && (
                      <div className="disease-symptoms">
                        {d.symptoms.map((s) => {
                          const sym = s.trim();
                          if (symFilter && !sym.toLowerCase().includes(symFilter)) return null;
                          return (
                            <label key={sym} className="checkbox-label">
                              <input
                                type="checkbox"
                                value={sym}
                                checked={selected.includes(sym)}
                                onChange={() => toggleSymptom(sym)}
                              />
                              {sym.replace(/_/g, ' ')}
                            </label>
                          );
                        })}
                        <button
                          type="button"
                          className="small-link"
                          onClick={() => {
                            // add all symptoms for this disease
                            setSelected((prev) => {
                              const add = d.symptoms.map((x) => x.trim());
                              const merged = Array.from(new Set([...prev, ...add]));
                              return merged;
                            });
                          }}
                        >
                          + Add all
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              {symptomsList
                .filter((symp) =>
                  !symFilter || symp.name.toLowerCase().includes(symFilter)
                )
                .map((symp) => {
                  const label = symp.name.replace(/_/g, ' ');
                  // user requested numbers not be visible; only the human-readable
                  // name is shown. the underlying `id` property is still fetched
                  // and could be used if we ever need to round‑trip codes, but it
                  // is not shown here so predictions remain based solely on
                  // symptom names.
                  return (
                    <label key={symp.name} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={symp.name}
                        checked={selected.includes(symp.name)}
                        onChange={() => toggleSymptom(symp.name)}
                      />
                      {label}
                    </label>
                  );
                })}
            </div>

            {/* chart showing number of selected symptoms per disease */}
            {matchData.length > 0 && (
              <div style={{marginTop:20}}>
                <h5>Matches per disease</h5>
                <DiseaseMatchChart data={matchData.slice(0, 10)} />
                {/* show top 10 for readability */}
              </div>
            )}

            {step===2 && selected.length===0 && symptomsList.length>0 && (
              <p style={{color:'#d9534f'}}>Please select at least one symptom to continue.</p>
            )}
            {step===2 && selected.length>0 && selected.length < MIN_SYMPTOMS && (
              <p style={{color:'#d9534f'}}>
                Select at least {MIN_SYMPTOMS} symptoms for a meaningful result.
              </p>
            )}
            <button type="button" onClick={() => fetchSymptoms()} className="btn-secondary" style={{marginTop:10}}>Reload symptoms</button>
          </>
        );
      case 3:
        return (
          <>
            <h4 className="section-title">Review & Submit</h4>
            <p><strong>Name:</strong> {userInfo.name}</p>
            <p><strong>Age:</strong> {userInfo.age}</p>
            <p><strong>Gender:</strong> {userInfo.gender}</p>
            <p><strong>Contact:</strong> {userInfo.contact}</p>
            <p><strong>Symptoms:</strong> {selected.map(s => s.replace(/_/g,' ')).join(', ') || 'None'}</p>
          </>
        );
      default:
        return null;
    }
  };

  const canNext = () => {
    if (step === 1) return canProceedToSymptoms();
    if (step === 2) return selected.length > 0;
    return true;
  };

  return (
    <div className="predict-container">
      <div className="predict-main">
        <h2>New Health Prediction</h2>
        <p>Fill in your details and select all relevant symptoms. Our machine learning models will analyze your profile to provide a detailed health risk assessment.</p>
        <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
          <div className="stepper">
            <div className={step === 1 ? 'active' : ''}>Details</div>
            <div className={step === 2 ? 'active' : ''}>Symptoms</div>
            <div className={step === 3 ? 'active' : ''}>Review</div>
          </div>
          {renderStepContent()}

          <div style={{marginTop:20, display:'flex', gap:10, flexWrap:'wrap'}}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary">
                Back
              </button>
            )}
            {step < 3 && (
              <button type="button" onClick={() => step < 3 && canNext() && setStep(step + 1)} disabled={!canNext()} className="btn-info">
                Next
              </button>
            )}
            {step === 3 && (
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Predicting...' : 'Generate Prediction'}
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="predict-sidebar sidebar-summary">
        <h3>Prediction Summary</h3>
        <p><strong>Selected Symptoms:</strong> {selected.length}</p>
        {result && (
          <>
            <p><strong>Disease:</strong> {result.prediction_adaboost}</p>
            <p>
              <span className={`risk-badge ${result.risk_level.toLowerCase()}`}>{result.risk_level} Risk</span>
              <span style={{marginLeft: '16px', fontWeight: 600, color: '#333'}}>
                Accuracy: {Math.round(result.accuracy_adaboost * 100)}%
              </span>
            </p>
          </>
        )}
        <button onClick={() => setSelected([])} className="btn-warning">Clear Selections</button>
      </div>
    </div>
  );
}

export default PredictForm;
