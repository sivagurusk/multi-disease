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

function DiseaseMatchChart({ data }) {
  const labels = data.map((d) => d.name);
  const values = data.map((d) => d.value);
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Symptoms matched',
        data: values,
        backgroundColor: 'rgba(255, 193, 7, 0.6)',
      },
    ],
  };
  const options = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Selected Symptoms per Disease' },
    },
    scales: {
      x: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };
  return <Bar data={chartData} options={options} />;
}

export default DiseaseMatchChart;