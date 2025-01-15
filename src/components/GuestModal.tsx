import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Guest, GuestFormData } from '../types/guest';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
  onSuccess: () => void;
}

export default function GuestModal({ isOpen, onClose, guest, onSuccess }: GuestModalProps) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<GuestFormData>({
    name: '',
    rank: '',
    status: '',
    arrivalLocation: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (guest) {
      setFormData({
        name: guest.name,
        rank: guest.rank || '',
        status: guest.status || '',
        arrivalLocation: guest.arrivalLocation || ''
      });
    } else {
      setFormData({
        name: '',
        rank: '',
        status: '',
        arrivalLocation: ''
      });
    }
  }, [guest]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      
      if (guest) {
        const { error } = await supabase
          .from('guests')
          .update(formData)
          .eq('id', guest.id);

        if (error) throw error;
        toast.success('Guest updated successfully');
      } else {
        const { error } = await supabase
          .from('guests')
          .insert([formData]);

        if (error) throw error;
        toast.success('Guest added successfully');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving guest:', error);
      toast.error(guest ? 'Failed to update guest' : 'Failed to add guest');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full transform transition-all hover:scale-[1.02]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {guest ? 'Edit Guest' : 'Add New Guest'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
                Rank
              </label>
              <input
                type="text"
                id="rank"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="">Select status</option>
                <option value="Arrived">Arrived</option>
                <option value="Pending">Pending</option>
                <option value="Not show">Not show</option>
              </select>
            </div>

            <div>
              <label htmlFor="arrivalLocation" className="block text-sm font-medium text-gray-700">
                Arrival Location
              </label>
              <input
                type="text"
                id="arrivalLocation"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-colors"
                value={formData.arrivalLocation}
                onChange={(e) => setFormData({ ...formData, arrivalLocation: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform hover:scale-105"
            >
              {loading ? 'Saving...' : guest ? 'Update Guest' : 'Add Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}