const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

// load numeric symptom index once
const symptomIndexPath = path.join(__dirname, '..', 'ml', 'symptom_list.txt');
let symptomMap = {};
if (fs.existsSync(symptomIndexPath)) {
  try {
    const lines = fs.readFileSync(symptomIndexPath, 'utf8').split(/\r?\n/);
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        const key = parts[0];
        const value = parts.slice(1).join('_');
        symptomMap[key] = value;
      }
    });
  } catch (e) {
    console.warn('failed to load symptom index', e);
  }
}

function normalizeSymptoms(input) {
  if (!Array.isArray(input)) return [];
  return input.map(s => {
    if (typeof s === 'number' || (typeof s === 'string' && /^\d+$/.test(s))) {
      const mapped = symptomMap[String(s)];
      return mapped || String(s);
    }
    return s;
  });
}


// expects { symptoms: ["fever", "cough"] }
router.post('/', auth, (req, res) => {
  let { symptoms, name, age, gender, contact } = req.body;
  if (!symptoms || !Array.isArray(symptoms)) {
    return res.status(400).json({ msg: 'Symptoms array required' });
  }
  // convert numeric codes to symptom names if necessary
  symptoms = normalizeSymptoms(symptoms);


  // check that model files are available
  const modelDir = path.join(__dirname, '..', 'ml', 'models');
  const adaboostFile = path.join(modelDir, 'adaboost.pkl');
  if (!fs.existsSync(adaboostFile)) {
    return res.status(500).json({ error: 'ML models not found. Please train the models first.' });
  }

  // launch Python script
  const py = spawn('python', ['ml/predict.py', JSON.stringify(symptoms)], { cwd: path.join(__dirname, '..') });
  let output = '';
  let errOut = '';

  py.stdout.on('data', (data) => {
    output += data.toString();
  });

  py.stderr.on('data', (data) => {
    errOut += data.toString();
  });

  py.on('close', (code) => {
    if (code !== 0) {
      console.error('Python error', errOut);
      return res.status(500).json({ error: 'Prediction script failed', details: errOut });
    }
    try {
      const result = JSON.parse(output);
      res.json(result);
    } catch (e) {
      console.error('Failed to parse python output', output);
      res.status(500).json({ error: 'Invalid prediction response', raw: output });
    }
  });
});


// return list of diseases and their associated symptoms from the training dataset
router.get('/diseases', auth, (req, res) => {
  try {
    const csv = fs.readFileSync(path.join(__dirname, '..', 'ml', 'dataset.csv'), 'utf8');
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return res.json({ diseases: [] });
    const headers = lines[0].split(',');
    const diseaseIdx = headers.indexOf('disease');
    const symptomCols = headers.filter((h, i) => i !== diseaseIdx);
    const diseaseMap = {};
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const disease = parts[diseaseIdx];
      if (!disease) continue;
      if (!diseaseMap[disease]) diseaseMap[disease] = new Set();
      symptomCols.forEach((col, idx) => {
        const val = parts[headers.indexOf(col)];
        if (val === '1' || val === 'true' || val === 'True') {
          diseaseMap[disease].add(col);
        }
      });
    }
    const diseases = Object.entries(diseaseMap).map(([d, s]) => ({ disease: d, symptoms: Array.from(s) }));
    res.json({ diseases });
  } catch (err) {
    console.error('failed to build diseases list', err);
    res.status(500).json({ error: 'Could not read diseases' });
  }
});

// new endpoint for symptom list (no auth required)
router.get('/symptoms', (req, res) => {
  try {
    const csv = fs.readFileSync(path.join(__dirname, '..', 'ml', 'dataset.csv'), 'utf8');
    const lines = csv.trim().split('\n');
    if (lines.length < 1) return res.json({ symptoms: [] });
    const headers = lines[0].split(',');
    const diseaseIdx = headers.indexOf('disease');
    let names = headers
      .filter((h, i) => i !== diseaseIdx)
      .map((s) => s.trim())
      .filter((s) => s && s.toLowerCase() !== 'disease');
    // remove duplicates just in case
    names = Array.from(new Set(names));
    // build objects with id if available in symptomMap reverse lookup
    const reverseMap = {};
    Object.entries(symptomMap).forEach(([k, v]) => {
      reverseMap[v] = k;
    });
    const payload = names.map((name) => ({
      name,
      id: reverseMap[name] || null
    }));
    res.json({ symptoms: payload });
  } catch (err) {
    console.error('failed to build symptoms list', err);
    res.status(500).json({ error: 'Could not read symptoms' });
  }
});

module.exports = router;