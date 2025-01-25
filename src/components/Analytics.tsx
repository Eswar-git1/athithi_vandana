import { X } from 'lucide-react';
import { Guest } from '../types/guest';

// React Chart.js 2 imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from 'chart.js';

import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { useMemo } from 'react';

// Register Chart.js components once at the top level:
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * All guests currently passed from GuestList; 
   * we focus our charts on those whose arrival_status = 'Arrived'.
   */
  guests: Guest[];
}

export default function Analytics({ isOpen, onClose, guests }: AnalyticsProps) {
  if (!isOpen) return null;

  // 1) Overall text-based summary (Arrived, Pending, Not show)
  const arrivedCount = guests.filter((g) => g.arrival_status === 'Arrived').length;
  const pendingCount = guests.filter((g) => g.arrival_status === 'Pending').length;
  const notShowCount = guests.filter((g) => g.arrival_status === 'Not show').length;

  // 2) Filter an array of only arrived guests:
  const arrivedGuests = useMemo(
    () => guests.filter((g) => g.arrival_status === 'Arrived'),
    [guests]
  );

  // Helper: Aggregate by a given field
  // Returns a Map of { fieldValue => countOfArrivedGuestsWithThatValue }
  function aggregateArrivalsByField(field: keyof Guest) {
    const map = new Map<string, number>();
    for (const g of arrivedGuests) {
      // Convert null or undefined to "Not Specified"
      const val = (g[field] as string) || 'Not Specified';
      map.set(val, (map.get(val) || 0) + 1);
    }
    return map;
  }

  // Build data for each dimension
  const dateMap = aggregateArrivalsByField('date');
  const hotelMap = aggregateArrivalsByField('hotel');
  const modeMap = aggregateArrivalsByField('mode_of_transport');
  const serviceMap = aggregateArrivalsByField('service_type');
  const rankMap = aggregateArrivalsByField('rank');

  // Convert a Map to { labels, data } for chart usage
  function toChartData(fieldMap: Map<string, number>, label: string) {
    const labels = Array.from(fieldMap.keys());
    const dataVals = Array.from(fieldMap.values());

    return {
      labels,
      datasets: [
        {
          label,
          data: dataVals,
          backgroundColor: [] as string[], // Initialize with empty array
        },
      ],
    };
  }

  // For multiple color usage in pie/doughnut
  function colorArray(length: number) {
    // Some pleasant color palette
    const palette = [
      '#4F46E5', '#EC4899', '#F59E0B', '#10B981', '#EF4444',
      '#6366F1', '#D946EF', '#3B82F6', '#F97316', '#84CC16',
      '#14B8A6', '#8B5CF6', '#EC4899', '#FBBF24', '#10B981',
    ];
    // If we need more than palette length, just repeat or randomize
    const colors = [];
    for (let i = 0; i < length; i++) {
      colors.push(palette[i % palette.length]);
    }
    return colors;
  }

  // CHART CONFIGS
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false, text: '' },
    },
    scales: {
      x: {
        ticks: { font: { size: 10 } },
      },
      y: {
        ticks: { font: { size: 10 } },
        beginAtZero: true,
      },
    },
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: { font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  // For Pie or Doughnut, we'll map data to backgroundColor array:
  function pieDataFromMap(fieldMap: Map<string, number>, label: string) {
    const labels = Array.from(fieldMap.keys());
    const dataVals = Array.from(fieldMap.values());
    const colors = colorArray(labels.length);

    return {
      labels,
      datasets: [
        {
          label,
          data: dataVals,
          backgroundColor: colors,
        },
      ],
    };
  }

  // Date wise arrival -> let's do a "Line" chart
  const dateLineData = useMemo(() => {
    const labels = Array.from(dateMap.keys()).sort(); // sort by date string
    const dataVals = labels.map((date) => dateMap.get(date) ?? 0);

    return {
      labels,
      datasets: [
        {
          label: 'Arrivals per Date',
          data: dataVals,
          borderColor: '#4F46E5', // Indigo
          backgroundColor: '#A5B4FC', // Lighter Indigo
          tension: 0.2,
        },
      ],
    };
  }, [dateMap]);

  // Hotel wise arrival -> "Bar" chart
  const hotelBarData = toChartData(hotelMap, 'Arrivals by Hotel');
  // Add some color
  const hotelColors = colorArray(hotelBarData.labels.length);
  hotelBarData.datasets[0].backgroundColor = hotelColors;

  // Mode of Transport -> "Pie"
  const modePieData = pieDataFromMap(modeMap, 'Arrivals by Transport');

  // Service Type -> "Doughnut"
  const serviceDoughnutData = pieDataFromMap(serviceMap, 'Arrivals by Service Type');

  // Rank wise arrival -> Another bar chart, but horizontal
  // (In Chart.js v3+ we do indexAxis: 'y')
  const rankBarData = toChartData(rankMap, 'Arrivals by Rank');
  const rankColors = colorArray(rankBarData.labels.length);
  rankBarData.datasets[0].backgroundColor = rankColors;
  const horizontalBarOptions = {
    ...barOptions,
    indexAxis: 'y' as const, // horizontal
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">
            Guest Analytics
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Text-based summary of all statuses */}
          <div className="bg-indigo-50 p-4 rounded-md shadow flex flex-col md:flex-row items-center justify-around gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-green-700">
                {arrivedCount}
              </span>
              <span className="text-sm text-gray-600">Arrived</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-yellow-700">
                {pendingCount}
              </span>
              <span className="text-sm text-gray-600">Pending</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-red-700">
                {notShowCount}
              </span>
              <span className="text-sm text-gray-600">Not Show</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-gray-800">
                {guests.length}
              </span>
              <span className="text-sm text-gray-600">Total Guests</span>
            </div>
          </div>

          {/* Chart Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date wise arrival -> line chart */}
            <div className="bg-white p-4 rounded-md shadow hover:shadow-lg transition-shadow h-[300px]">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Date‐wise Arrivals (Line)
              </h3>
              <Line data={dateLineData} options={lineOptions} />
            </div>

            {/* Hotel wise arrival -> bar chart */}
            <div className="bg-white p-4 rounded-md shadow hover:shadow-lg transition-shadow h-[300px]">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Hotel‐wise Arrivals (Bar)
              </h3>
              <div className="h-full">
                <Bar data={hotelBarData} options={barOptions} />
              </div>
            </div>

            {/* Mode of Transport -> pie chart */}
            <div className="bg-white p-4 rounded-md shadow hover:shadow-lg transition-shadow h-[300px]">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Transport (Pie)
              </h3>
              <Pie data={modePieData} />
            </div>

            {/* Service Type -> doughnut chart */}
            <div className="bg-white p-4 rounded-md shadow hover:shadow-lg transition-shadow h-[300px]">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Service Type (Doughnut)
              </h3>
              <Doughnut data={serviceDoughnutData} />
            </div>

            {/* Rank wise arrival -> horizontal bar */}
            <div className="bg-white p-4 rounded-md shadow hover:shadow-lg transition-shadow h-[300px] md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Rank‐wise Arrivals (Horizontal Bar)
              </h3>
              <div className="h-full">
                <Bar data={rankBarData} options={horizontalBarOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
