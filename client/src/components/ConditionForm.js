import React, { useState } from 'react';
import './PredictForm.css'; // reuse existing styles

// define symptoms per condition
const CONDITION_DATA = {
  diabetes: {
    title: 'Diabetes Risk Assessment',
    // expanded list to 20+ common diabetes-related symptoms
    symptoms: [
      'high_blood_sugar',
      'frequent_urination',
      'increased_thirst',
      'increased_hunger',
      'fatigue',
      'blurred_vision',
      'slow_healing',
      'numbness',
      'weight_loss',
      'weight_gain',
      'dry_mouth',
      'mouth_ulcers',
      'skin_rash',
      'itching',
      'yeast_infection',
      'foot_pain',
      'tingling_pain',
      'cold_extremities',
      'infection_infections',
      'hair_loss',
      'acne',
      'frequent_infections'
    ],
    suggestions: {
      low: ['Maintain healthy diet', 'Exercise regularly', 'Monitor blood sugar occasionally'],
      medium: ['Schedule a doctor visit', 'Check blood glucose levels', 'Adjust diet and activity'],
      high: ['Seek medical evaluation immediately', 'Get blood sugar tested', 'Follow doctor’s treatment plan']
    }
  },
  heart: {
    title: 'Heart Disease Risk Assessment',
    // expanded list to 20+ cardiovascular symptoms
    symptoms: [
      'chest_pain',
      'shortness_of_breath',
      'palpitations',
      'dizziness',
      'fatigue',
      'ankle_swelling',
      'irregular_heartbeat',
      'chest_tightness',
      'cold_extremities',
      'neck_pain',
      'back_pain',
      'jaw_pain',
      'arm_pain',
      'shoulder_pain',
      'leg_swelling',
      'edema',
      'exercise_intolerance',
      'chest_pressure',
      'chest_heaviness',
      'pounding_heartbeat',
      'fainting',
      'vertigo',
      'cold_sweats',
      'nausea',
      'vomiting',
      'anxiety',
      'restlessness',
      'weak_pulse'
    ],
    suggestions: {
      low: ['Maintain cardiovascular fitness', 'Eat heart-healthy foods', 'Avoid smoking'],
      medium: ['Consult a cardiologist', 'Monitor blood pressure regularly', 'Reduce stress'],
      high: ['Seek emergency care', 'Do not ignore symptoms', 'Follow medical advice immediately']
    }
  }
};

export default function ConditionForm({ condition }) {
  const key = condition.toLowerCase();
  const data = CONDITION_DATA[key];
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [risk, setRisk] = useState(null);

  // if the parent route changes the condition prop (e.g. switching between
  // diabetes and heart), clear any previous state so results don’t “bleed
  // through”. React Router re‑uses the component instance when only props
  // change, so we watch for the computed key.
  React.useEffect(() => {
    setSelected([]);
    setSubmitted(false);
    setRisk(null);
  }, [key]);

  if (!data) {
    return <p>Unknown condition: {condition}</p>;
  }

  const toggle = (sym) => {
    setSelected((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const computeRisk = () => {
    const count = selected.length;
    const total = data.symptoms.length;
    const frac = total === 0 ? 0 : count / total;
    let level = 'low';
    if (frac >= 0.66) level = 'high';
    else if (frac >= 0.33) level = 'medium';
    setRisk(level);
    setSubmitted(true);
  };

  const nextSteps = risk ? data.suggestions[risk] : [];

  return (
    <div className="predict-container">
      <div className="predict-main">
        <h2>{data.title}</h2>
        <p>Select any symptoms you are experiencing below and click "Evaluate Risk".</p>
        <div className="symptom-list">
          {data.symptoms.map((sym) => (
            <label key={sym} className="checkbox-label">
              <input
                type="checkbox"
                value={sym}
                checked={selected.includes(sym)}
                onChange={() => toggle(sym)}
              />
              {sym.replace(/_/g, ' ')}
            </label>
          ))}
        </div>
        <button onClick={computeRisk} className="btn-primary" style={{marginTop:20}}>
          Evaluate Risk
        </button>
        {submitted && (
          <div style={{marginTop:20}}>
            <h3>Risk Level: <span className={`risk-badge ${risk}`}>{risk.charAt(0).toUpperCase()+risk.slice(1)}</span></h3>
            {nextSteps.length > 0 && (
              <div>
                <h4>Suggested Next Steps</h4>
                <ul>
                  {nextSteps.map((n,i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
