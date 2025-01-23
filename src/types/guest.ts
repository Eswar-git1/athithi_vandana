export interface Guest {
  id: string;
  rank?: string;
  name: string;
  arrival_time?: string;
  mode_of_transport?: 'Flight' | 'Train' | 'Road' | 'Own Arrangement';
  transport_details?: string;
  arriving_from?: string;
  date?: string; // YYYY-MM-DD format
  occupants?: number;
  hotel?: string;
  service_type?: 'Veteran' | 'Serving';
  time_slot?: string; // Example: '0000-0100'
  arrival_status?: 'Arrived' | 'Pending' | 'Not show';
  remarks?: string;
  received_by?: string; // Email of the logged-in user
}

export interface GuestFormData {
  rank?: string;
  name: string;
  arrival_time?: string;
  mode_of_transport?: 'Flight' | 'Train' | 'Road' | 'Own Arrangement';
  transport_details?: string;
  arriving_from?: string;
  date?: string; // YYYY-MM-DD format
  occupants?: number;
  hotel?: string;
  service_type?: 'Veteran' | 'Serving';
  time_slot?: string; // Example: '0000-0100'
  arrival_status?: 'Arrived' | 'Pending' | 'Not show';
  remarks?: string;
  received_by?: string; // Email of the logged-in user
}
