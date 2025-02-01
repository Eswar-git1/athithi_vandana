import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GuestFormData } from '../types/guest';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest?: GuestFormData | null;
  onSuccess: () => void;
}

export default function GuestModal({
  isOpen,
  onClose,
  guest,
  onSuccess,
}: GuestModalProps) {
  const { currentUser } = useAuth();

  // Initial blank form
  const initialFormState: GuestFormData = {
    rank: '',
    name: '',
    arrival_time: '',
    mode_of_transport: undefined,
    arriving_from: '',
    transport_details: '',
    date: '',
    occupants: 1,
    hotel: '',
    remarks: '',
    service_type: undefined,
    time_slot: '',
    arrival_status: 'Pending',
    received_by: currentUser?.email || '',
  };

  const [formData, setFormData] = useState<GuestFormData>(initialFormState);
  const [loading, setLoading] = useState(false);

  // Build a list of time options for arrival_time dropdown
  const timeOptions = Array.from({ length: 24 }, (_, hour) =>
    Array.from({ length: 60 }, (_, minute) =>
      `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}:00`
    )
  ).flat();

  // Whenever guest changes, reset the form. If editing, load existing; if new, use blank + user email
  useEffect(() => {
    if (guest) {
      setFormData(guest);
    } else {
      setFormData({
        ...initialFormState,
        received_by: currentUser?.email || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guest, currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      toast.error('User is not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Copy current formData
      const dataToSubmit: Partial<GuestFormData> = { ...formData };

      // If the user sets arrival_status != 'Pending', ensure 'received_by' is the current user
      if (dataToSubmit.arrival_status !== 'Pending') {
        dataToSubmit.received_by = currentUser.email || '';
      }

      let response;
      if (guest && guest.id) {
        // If editing an existing guest
        response = await supabase
          .from('guests')
          .update(dataToSubmit)
          .eq('id', guest.id);
      } else {
        // Creating a new guest
        response = await supabase.from('guests').insert([dataToSubmit]);
      }

      if (response.error) throw response.error;

      toast.success(guest ? 'Guest updated successfully' : 'Guest added successfully');
      onSuccess();
      // Reset the form
      setFormData({
        ...initialFormState,
        received_by: currentUser?.email || '',
      });
    } catch (error) {
      console.error('Error saving guest:', error);
      toast.error('Failed to save guest details');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl transform transition-all hover:scale-[1.02]">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-indigo-100 to-indigo-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {guest ? 'Edit Guest' : 'Add New Guest'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
              Rank
            </label>
            <input
              type="text"
              id="rank"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.rank || ''}
              onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="arrival_time" className="block text-sm font-medium text-gray-700">
              Arrival Time
            </label>
            <select
              id="arrival_time"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.arrival_time || ''}
              onChange={(e) =>
                setFormData({ ...formData, arrival_time: e.target.value })
              }
            >
              <option value="">Select Time</option>
              {timeOptions.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="mode_of_transport"
              className="block text-sm font-medium text-gray-700"
            >
              Mode of Transport
            </label>
            <select
              id="mode_of_transport"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.mode_of_transport || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mode_of_transport: e.target.value as "Flight" | "Train" | "Road" | "Own Arrangement" | undefined,
                })
              }
            >
              <option value="">Select Mode</option>
              <option value="Flight">Flight</option>
              <option value="Train">Train</option>
              <option value="Road">Road</option>
              <option value="Own Arrangement">Own Arrangement</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="arriving_from"
              className="block text-sm font-medium text-gray-700"
            >
              Arriving From
            </label>
            <input
              type="text"
              id="arriving_from"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.arriving_from || ''}
              onChange={(e) =>
                setFormData({ ...formData, arriving_from: e.target.value })
              }
            />
          </div>

          <div>
            <label
              htmlFor="transport_details"
              className="block text-sm font-medium text-gray-700"
            >
              Transport Details
            </label>
            <textarea
              id="transport_details"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.transport_details || ''}
              onChange={(e) =>
                setFormData({ ...formData, transport_details: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.date || ''}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="occupants" className="block text-sm font-medium text-gray-700">
              Occupants
            </label>
            <select
              id="occupants"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.occupants || 1}
              onChange={(e) =>
                setFormData({ ...formData, occupants: Number(e.target.value) })
              }
            >
              {[...Array(10)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="hotel" className="block text-sm font-medium text-gray-700">
              Hotel
            </label>
            <input
              type="text"
              id="hotel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.hotel || ''}
              onChange={(e) => setFormData({ ...formData, hotel: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="service_type"
              className="block text-sm font-medium text-gray-700"
            >
              Service Type
            </label>
            <select
              id="service_type"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.service_type || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  service_type: e.target.value as "Veteran" | "Serving" | undefined,
                })
              }
            >
              <option value="">Select Service Type</option>
              <option value="Veteran">Veteran</option>
              <option value="Serving">Serving</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="arrival_status"
              className="block text-sm font-medium text-gray-700"
            >
              Arrival Status
            </label>
            <select
              id="arrival_status"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.arrival_status || 'Pending'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  arrival_status: e.target.value as 'Arrived' | 'Pending' | 'Not show' | 'Departed',
                })
              }
            >
              <option value="Pending">Pending</option>
              <option value="Arrived">Arrived</option>
              <option value="Not show">Not show</option>
              <option value="Departed">Departed</option>
            </select>
          </div>


          <div>
            <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              id="remarks"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              value={formData.remarks || ''}
              onChange={(e) =>
                setFormData({ ...formData, remarks: e.target.value })
              }
            />
          </div>

          {/* Buttons */}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? 'Saving...' : guest ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
