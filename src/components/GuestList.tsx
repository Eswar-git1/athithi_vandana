import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Guest } from '../types/guest';
import { Users, UserPlus, Edit, Trash2, Search, LogOut, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import GuestModal from './GuestModal';
import Analytics from './Analytics';

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    fetchGuests();
  }, [currentUser]);

  async function fetchGuests() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('name');

      if (error) throw error;
      setGuests(data || []);
    } catch (error) {
      console.error('Error fetching guests:', error);
      toast.error('Failed to load guests');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGuest(guestId: string) {
    if (!confirm('Are you sure you want to delete this guest?')) return;

    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .match({ id: guestId });

      if (error) throw error;
      
      setGuests(guests.filter(guest => guest.id !== guestId));
      toast.success('Guest deleted successfully');
    } catch (error) {
      console.error('Error deleting guest:', error);
      toast.error('Failed to delete guest');
    }
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.rank?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.arrivalLocation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                अतिथि वंदना
              </h1>
              <p className="text-gray-600">Guest Reception 11th CRU</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsAnalyticsOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all transform hover:scale-105"
            >
              <BarChart2 className="h-5 w-5 mr-2" />
              Analytics
            </button>
            <button
              onClick={() => {
                setSelectedGuest(null);
                setIsModalOpen(true);
              }}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Add Guest
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search guests..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading guests...</p>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No guests found matching your search.' : 'No guests added yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all hover:shadow-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guest.rank || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(guest.status || '')}`}>
                        {guest.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {guest.arrivalLocation || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedGuest(guest);
                          setIsModalOpen(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors"
                      >
                        <Edit className="h-5 w-5 transform hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-5 w-5 transform hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <GuestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          guest={selectedGuest}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchGuests();
          }}
        />

        <Analytics
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          guests={guests}
        />
      </div>
    </div>
  );
}