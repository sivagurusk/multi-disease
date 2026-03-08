const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const router = express.Router();

// add a new labeled example to the CSV and kick off retraining
router.post('/add', (req, res) => {
  const { disease, symptoms } = req.body;
  if (!disease || !Array.isArray(symptoms)) {
    return res.status(400).json({ error: 'disease and symptoms array required' });
  }
  const csvPath = path.join(__dirname, '..', 'ml', 'dataset.csv');
  if (!fs.existsSync(csvPath)) {
    return res.status(500).json({ error: 'dataset file not found' });
  }
  const header = fs.readFileSync(csvPath, 'utf8').split('\n')[0].split(',');
  const row = header
    .map((col) => {
      if (col === 'disease') return disease;
      return symptoms.includes(col) ? '1' : '0';
    })
    .join(',');
  fs.appendFileSync(csvPath, '\n' + row);

  // spawn training process asynchronously
  const py = spawn('python', ['ml/train.py'], { cwd: path.join(__dirname, '..') });
  py.on('close', (code) => {
    console.log('retraining finished with exit code', code);
  });
  py.stderr.on('data', (data) => {
    console.error('train error:', data.toString());
  });

  res.json({ msg: 'Sample added. Retraining in background.' });
});

module.exports = router;
