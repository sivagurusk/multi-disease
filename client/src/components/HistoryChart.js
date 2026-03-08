import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function HistoryChart({ history }) {
  const counts = {};
  history.forEach(h => {
    const d = h.result.prediction_adaboost;
    counts[d] = (counts[d] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const data = {
    labels,
    datasets: [
      {
        label: 'Occurrences',
        data: labels.map(l => counts[l]),
        backgroundColor: 'rgba(40, 167, 69, 0.6)',
      }
    ]
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Disease Frequency' }
    }
  };
  return <Bar data={data} options={options} />;
}

export default HistoryChart;