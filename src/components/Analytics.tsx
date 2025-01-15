import { X, PieChart, Users, MapPin } from 'lucide-react';
import { Guest } from '../types/guest';

interface AnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
}

export default function Analytics({ isOpen, onClose, guests }: AnalyticsProps) {
  if (!isOpen) return null;

  const statusCounts = guests.reduce((acc, guest) => {
    const status = guest.status || 'Not specified';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationCounts = guests.reduce((acc, guest) => {
    const location = guest.arrivalLocation || 'Not specified';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Arrived':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center">
            <PieChart className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">Guest Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Guest Status Distribution</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(status)}`}>
                    {status}
                  </span>
                  <div className="flex items-center">
                    <div className="w-48 h-2 bg-gray-200 rounded-full mr-3">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{
                          width: `${(count / guests.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Arrival Locations</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(locationCounts).map(([location, count]) => (
                <div key={location} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{location}</span>
                  <div className="flex items-center">
                    <div className="w-48 h-2 bg-gray-200 rounded-full mr-3">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{
                          width: `${(count / guests.length) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {guests.length}
              </h3>
              <p className="text-gray-600">Total Guests</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}