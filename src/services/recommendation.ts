import { Reservation, Room } from '../models/types';

export interface RecommendInput {
  durationMinutes: number;
  attendees: number;
  requiredEquipment: Set<string>;
  startFrom: Date;
}

export interface RoomCandidate {
  room: Room;
  score: number; // lower is better
}

export function isRoomAvailable(roomId: string, start: Date, end: Date, reservations: Reservation[]): boolean {
  const s = start.getTime();
  const e = end.getTime();
  return reservations
    .filter(r => r.roomId === roomId)
    .every(r => {
      const rs = new Date(r.start).getTime();
      const re = new Date(r.end).getTime();
      return re <= s || rs >= e; // no overlap
    });
}

export function recommendRooms(input: RecommendInput, rooms: Room[], reservations: Reservation[]): RoomCandidate[] {
  const end = new Date(input.startFrom.getTime() + input.durationMinutes * 60 * 1000);

  const candidates = rooms
    .filter(room => {
      // equipment exact cover (must include all required)
      const hasAll = [...input.requiredEquipment].every(eq => room.equipment.includes(eq as any));
      if (!hasAll) return false;
      // availability
      return isRoomAvailable(room.id, input.startFrom, end, reservations);
    })
    .map(room => {
      // score: capacity closeness (abs(capacity - attendees))
      const score = Math.abs(room.capacity - input.attendees);
      return { room, score } as RoomCandidate;
    })
    .sort((a,b) => a.score - b.score);

  return candidates;
}
