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

function SymptomChart({ data }) {
  const labels = data.map(d => d.name);
  const values = data.map(d => d.value);
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Selected Symptoms',
        data: values,
        backgroundColor: 'rgba(23, 162, 184, 0.6)',
      }
    ]
  };
  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Symptoms Entered' }
    },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };
  return <Bar data={chartData} options={options} />;
}

export default SymptomChart;