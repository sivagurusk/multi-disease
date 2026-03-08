const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// connect db
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/history', require('./routes/history'));
app.use('/api/train', require('./routes/train'));

const port = parseInt(process.env.PORT, 10) || 5000;

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

