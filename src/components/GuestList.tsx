import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Guest } from '../types/guest';
import {
  Users,
  UserPlus,
  Edit,
  LogOut,
  RefreshCw,
  BarChart2,
  Printer,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

import GuestModal from './GuestModal';
import Analytics from './Analytics';

// 24-hour time slots
const TIME_SLOTS = [
  '0000-0100',
  '0100-0200',
  '0200-0300',
  '0300-0400',
  '0400-0500',
  '0500-0600',
  '0600-0700',
  '0700-0800',
  '0800-0900',
  '0900-1000',
  '1000-1100',
  '1100-1200',
  '1200-1300',
  '1300-1400',
  '1400-1500',
  '1500-1600',
  '1600-1700',
  '1700-1800',
  '1800-1900',
  '1900-2000',
  '2000-2100',
  '2100-2200',
  '2200-2300',
  '2300-2400',
   'Not Specified',
];

// Helper to see if arrival_time falls within a chosen slot
function isTimeInSlot(timeStr: string, slot: string) {
  if (slot === 'Not Specified') {
    return !timeStr; // If slot is "Not Specified", check for blanks
  }
  if (!timeStr) return false; // Ensure other slots exclude blanks

  const [hrStr, minStr] = timeStr.substring(0, 5).split(':');
  const hour = parseInt(hrStr, 10);
  const minute = parseInt(minStr, 10);
  const totalMinutes = hour * 60 + minute;

  const [startStr, endStr] = slot.split('-');
  const startHour = parseInt(startStr.substring(0, 2), 10);
  const startMin = parseInt(startStr.substring(2, 4), 10);
  const endHour = parseInt(endStr.substring(0, 2), 10);
  const endMin = parseInt(endStr.substring(2, 4), 10);

  const startTotal = startHour * 60 + startMin;
  let endTotal = endHour * 60 + endMin;
  if (endTotal === 2400) endTotal = 1440;

  return totalMinutes >= startTotal && totalMinutes < endTotal;
}

export default function GuestList() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    rank: '',
    date: '',
    time_slot: '',
    mode_of_transport: '',
    hotel: '',
    arrival_status: '',
    service_type: '', // Add this
  });

  const [rankOptions, setRankOptions] = useState<string[]>([]);
  const [hotelOptions, setHotelOptions] = useState<string[]>([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const { currentUser, logout } = useAuth();

  // 1) "tableRef" for react-to-print
  const tableRef = useRef<HTMLDivElement>(null);

  // 2) Prepare the print function
  const handlePrint = useReactToPrint({
    content: () => tableRef.current, // The DOM to print
    documentTitle: 'Guest_List',
    onAfterPrint: () => toast.success('Print/Export complete!'),
  });

  // 3) Use effect to fetch data & set up real-time
  useEffect(() => {
    fetchGuests();

    const channel = supabase
      .channel('realtime_guests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guests' },
        () => {
          // Re-fetch whenever there's an insert/update/delete
          fetchGuests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // 4) Fetch from Supabase
  async function fetchGuests() {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) {
        setGuests(data);

        // Distinct Ranks & Hotels
        const distinctRanks = Array.from(new Set(data.map((g) => g.rank).filter(Boolean))).sort();
        const distinctHotels = Array.from(new Set(data.map((g) => g.hotel).filter(Boolean))).sort();

        setRankOptions(distinctRanks as string[]);
        setHotelOptions(distinctHotels as string[]);
      }
    } catch (err) {
      console.error('Error fetching guests:', err);
      toast.error('Failed to load guests');
    }
  }

  // 5) Logout
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  // 6) Filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // 7) Build filtered guest list
  const filteredGuests = guests.filter((guest) => {
    // Existing filters
    const matchesSearchTerm =
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (guest.rank || '').toLowerCase().includes(searchTerm.toLowerCase());
  
    if (filters.rank && guest.rank !== filters.rank) return false;
    if (filters.arrival_status && guest.arrival_status !== filters.arrival_status) return false;
    if (filters.mode_of_transport && guest.mode_of_transport !== filters.mode_of_transport)
      return false;
    if (filters.hotel && guest.hotel !== filters.hotel) return false;
    if (filters.date && guest.date !== filters.date) return false;
    if (filters.service_type && guest.service_type !== filters.service_type) return false; // New filter
  
    if (filters.time_slot) {
      if (!isTimeInSlot(guest.arrival_time || '', filters.time_slot)) return false;
    }
    return matchesSearchTerm;
  });

  // 8) Color coding
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

  // 9) Refresh action (explicitly reload or just fetch again)
  const handleRefresh = () => {
    // If you actually want to reload the entire page:
    // window.location.reload();
    // If you only want to re-fetch from Supabase (which also triggers a UI update):
    fetchGuests();
    toast.success('Data refreshed!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between items-center mb-6 gap-4">
          {/* Title */}
          <div className="flex items-center">
            <Users className="h-8 w-8 text-indigo-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                अतिथि वंदना
              </h1>
              <p className="text-gray-600">Guest Reception 11th CRU</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-4">
            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-all transform hover:scale-105"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </button>

            {/* Analytics */}
            <button
              onClick={() => setAnalyticsOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <BarChart2 className="h-5 w-5 mr-2" />
              Analytics
            </button>

            {/* Print/Export */}
            <button
              onClick={() => handlePrint()} 
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <Printer className="h-5 w-5 mr-2" />
              Print/Export
            </button>

            {/* Add Guest */}
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Name or Rank..."
            className="flex-grow block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Rank Filter */}
          <select
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.rank}
            onChange={(e) => handleFilterChange('rank', e.target.value)}
          >
            <option value="">All Ranks</option>
            {rankOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {/* Date Filter */}
          <input
            type="date"
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          />
          {/* Time Slot Filter */}
            {/* Time Slot Filter */}
            <select
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.time_slot}
            onChange={(e) => handleFilterChange('time_slot', e.target.value)}
            >
            <option value="">All Time Slots</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
              {slot}
              </option>
            ))}
            </select>
          {/* Mode of Transport Filter */}
          <select
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.mode_of_transport}
            onChange={(e) => handleFilterChange('mode_of_transport', e.target.value)}
          >
            <option value="">Mode of Transport</option>
            <option value="Flight">Flight</option>
            <option value="Train">Train</option>
            <option value="Road">Road</option>
            <option value="Own Arrangement">Own Arrangement</option>
          </select>
          {/* Hotel Filter */}
          <select
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.hotel}
            onChange={(e) => handleFilterChange('hotel', e.target.value)}
          >
            <option value="">All Hotels</option>
            {hotelOptions.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
            {/* Service Type Filter */}
            <select
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.service_type}
            onChange={(e) => handleFilterChange('service_type', e.target.value)}
            >
            <option value="">All Service Types</option>
            <option value="Veteran">Veteran</option>
            <option value="Serving">Serving</option>
            </select>
          {/* Arrival Status Filter */}
          <select
            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.arrival_status}
            onChange={(e) => handleFilterChange('arrival_status', e.target.value)}
          >
            <option value="">All Arrival Status</option>
            <option value="Arrived">Arrived</option>
            <option value="Pending">Pending</option>
            <option value="Not show">Not show</option>
          </select>
        </div>

        {/* Table to Print */}
        <div ref={tableRef} className="w-full overflow-x-auto rounded-lg shadow-lg bg-white p-4">
          <table className="table-fixed w-full text-sm md:text-base">
            <thead className="bg-indigo-100">
              <tr className="text-left">
                <th className="w-[50px] px-2 py-2 font-medium text-gray-700">S. No.</th>
                <th className="w-[60px] px-2 py-2 font-medium text-gray-700">Rank</th>
                <th className="w-[120px] px-2 py-2 font-medium text-gray-700">Name</th>
                <th className="w-[80px] px-2 py-2 font-medium text-gray-700">Time</th>
                <th className="w-[90px] px-2 py-2 font-medium text-gray-700">Mode</th>
                <th className="w-[120px] px-2 py-2 font-medium text-gray-700">Transport</th>
                <th className="w-[90px] px-2 py-2 font-medium text-gray-700">Date</th>
                <th className="w-[80px] px-2 py-2 font-medium text-gray-700">Occupants</th>
                <th className="w-[100px] px-2 py-2 font-medium text-gray-700">Hotel</th>
                <th className="w-[100px] px-2 py-2 font-medium text-gray-700">Remarks</th>
                <th className="w-[100px] px-2 py-2 font-medium text-gray-700">Service</th>
                <th className="w-[120px] px-2 py-2 font-medium text-gray-700">Received By</th>
                <th className="w-[100px] px-2 py-2 font-medium text-gray-700">Status</th>
                <th className="w-[60px] px-2 py-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest, index) => (
                <tr
                  key={guest.id}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="px-2 py-2">{index + 1}</td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.rank || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.name}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.arrival_time || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.mode_of_transport || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.transport_details || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.date || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.occupants ?? '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.hotel || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.remarks || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.service_type || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    {guest.received_by || '-'}
                  </td>
                  <td className="px-2 py-2 break-words whitespace-normal">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getStatusColor(
                        guest.arrival_status || ''
                      )}`}
                    >
                      {guest.arrival_status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => {
                        setSelectedGuest(guest);
                        setIsModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-4 text-center text-gray-500">
                    No matching guests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Guest Modal */}
        <GuestModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          guest={selectedGuest}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchGuests(); // re-fetch on success
          }}
        />

        {/* Analytics Modal */}
        <Analytics
          isOpen={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
          guests={filteredGuests}
        />
      </div>
    </div>
  );
}
