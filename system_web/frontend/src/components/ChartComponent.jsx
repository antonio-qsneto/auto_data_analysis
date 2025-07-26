import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function ChartComponent({ data }) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Values',
        data: data.values,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-white shadow rounded">
      <Line data={chartData} />
    </div>
  );
}
