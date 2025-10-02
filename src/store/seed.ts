import { Room } from '../models/types';

export const seedRooms: Room[] = [
  { id: 'R1', name: 'Alpha', capacity: 4, equipment: ['whiteboard'] },
  { id: 'R2', name: 'Beta', capacity: 6, equipment: ['projector'] },
  { id: 'R3', name: 'Gamma', capacity: 6, equipment: ['tvconf'] },
  { id: 'R4', name: 'Delta', capacity: 8, equipment: ['projector','whiteboard'] },
  { id: 'R5', name: 'Epsilon', capacity: 10, equipment: ['tvconf','whiteboard'] },
  { id: 'R6', name: 'Zeta', capacity: 12, equipment: ['projector','tvconf'] },
  { id: 'R7', name: 'Eta', capacity: 12, equipment: ['projector','tvconf','whiteboard'] },
  { id: 'R8', name: 'Theta', capacity: 16, equipment: ['projector'] },
  { id: 'R9', name: 'Iota', capacity: 20, equipment: ['tvconf'] },
  { id: 'R10', name: 'Kappa', capacity: 20, equipment: ['projector','tvconf','whiteboard'] }
];
