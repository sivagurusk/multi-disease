import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import PredictForm from './components/PredictForm';
import History from './components/History';
import ResultPage from './components/ResultPage';
import LoadingPage from './components/LoadingPage';
import ConditionForm from './components/ConditionForm';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  const handleLogin = (t) => {
    setToken(t);
    localStorage.setItem('token', t);
  };
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <div className="App" style={{ padding: 20 }}>
      <h1 style={{color:'#fff',fontWeight:'bold',textAlign:'center'}}>🌟 Multi-Disease Predictor 🌟</h1>
      {token && (
        <div className="nav-container">
          <div>
            <button onClick={() => navigate('/')} className="btn-primary">New Prediction</button>
            <button onClick={() => navigate('/diabetes')} className="btn-secondary">Diabetes</button>
            <button onClick={() => navigate('/heart')} className="btn-secondary">Heart Disease</button>
            <button onClick={() => navigate('/history')} className="btn-secondary">History</button>
          </div>
          <button onClick={handleLogout} className="btn-danger logout-btn">Logout</button>
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            token ? <PredictForm token={token} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/diabetes"
          element={
            token ? <ConditionForm condition="diabetes" /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/heart"
          element={
            token ? <ConditionForm condition="heart" /> : <Navigate to="/login" />
          }
        />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/result"
          element={token ? <ResultPage token={token} /> : <Navigate to="/login" />}
        />
        <Route
          path="/loading"
          element={token ? <LoadingPage token={token} /> : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={token ? <History /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
}

export default App;
