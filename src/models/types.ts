export type Equipment = 'projector' | 'tvconf' | 'whiteboard';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: Equipment[];
}

export interface Reservation {
  id: string;
  roomId: string;
  title: string;
  start: string; // ISO string, 15-min granularity
  end: string;   // ISO string, 15-min granularity
  attendees: number;
  purpose?: string;
  createdBy: string;
}
