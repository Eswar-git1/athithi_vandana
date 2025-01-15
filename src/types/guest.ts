export interface Guest {
  id: string;
  rank?: string;
  name: string;
  status?: 'Arrived' | 'Pending' | 'Not show';
  arrivalLocation?: string;
}

export interface GuestFormData {
  rank?: string;
  name: string;
  status?: string;
  arrivalLocation?: string;
}