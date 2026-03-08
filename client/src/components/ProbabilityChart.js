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

function ProbabilityChart({ distribution }) {
  const labels = distribution.map((p) => p.disease);
  const data = {
    labels,
    datasets: [
      {
        label: 'Probability (%)',
        data: distribution.map((p) => Math.round(p.probability * 100)),
        backgroundColor: 'rgba(40, 167, 69, 0.6)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Probability Distribution',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (val) => val + '%' },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export default ProbabilityChart;
