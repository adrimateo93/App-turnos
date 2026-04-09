import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const StatsChart = ({ data, isDark }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#e5e7eb' : '#1f2937',
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: isDark ? '#1f2937' : '#ffffff',
        titleColor: isDark ? '#e5e7eb' : '#1f2937',
        bodyColor: isDark ? '#e5e7eb' : '#1f2937',
        borderColor: isDark ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(1) + 'h';
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280',
          callback: function(value) {
            return value + 'h';
          }
        }
      },
      x: {
        grid: {
          color: isDark ? '#374151' : '#e5e7eb',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        },
        ticks: {
          color: isDark ? '#9ca3af' : '#6b7280'
        }
      }
    }
  };

  return (
    <div className="h-64 sm:h-80">
      <Line data={data} options={options} />
    </div>
  );
};
