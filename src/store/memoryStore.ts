import { Reservation, Room } from '../models/types';

class InMemoryStore {
  private rooms: Room[] = [];
  private reservations: Reservation[] = [];

  getRooms(): Room[] { return this.rooms; }
  setRooms(rooms: Room[]): void { this.rooms = rooms; }

  getReservations(): Reservation[] { return this.reservations; }
  addReservation(r: Reservation): void { this.reservations.push(r); }
  removeReservation(id: string): void {
    this.reservations = this.reservations.filter(x => x.id !== id);
  }

  findRoomById(id: string): Room | undefined {
    return this.rooms.find(r => r.id === id);
  }
}

export const db = new InMemoryStore();
