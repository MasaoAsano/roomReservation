import { Router } from 'express';
import { z } from 'zod';
import { db } from '../store/memoryStore';
import { isRoomAvailable } from '../services/recommendation';
import { Reservation } from '../models/types';
import { NoopOutlookClient } from '../services/outlook';

const router = Router();

const createSchema = z.object({
  roomId: z.string(),
  title: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
  attendees: z.number().min(1),
  purpose: z.string().optional(),
  createdBy: z.string().default('anonymous')
});

router.get('/', (_req, res) => {
  res.json({ reservations: db.getReservations() });
});

router.post('/', (req, res) => {
  const parse = createSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { roomId, title, start, end, attendees, purpose, createdBy } = parse.data;

  const room = db.findRoomById(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const s = new Date(start);
  const e = new Date(end);
  // 15-min granularity check
  const is15 = (d: Date) => d.getUTCMinutes() % 15 === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0;
  if (!is15(s) || !is15(e)) return res.status(400).json({ error: 'Start/End must align to 15 minutes' });

  if (e <= s) return res.status(400).json({ error: 'End must be after Start' });
  const duration = (e.getTime() - s.getTime()) / 60000;
  if (duration < 15 || duration > 120) return res.status(400).json({ error: 'Duration must be between 15 and 120 minutes' });

  if (!isRoomAvailable(roomId, s, e, db.getReservations())) {
    return res.status(409).json({ error: 'Time slot is not available' });
  }

  const newRes: Reservation = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    roomId,
    title,
    start: s.toISOString(),
    end: e.toISOString(),
    attendees,
    purpose,
    createdBy
  };
  db.addReservation(newRes);
  const outlook = new NoopOutlookClient();
  outlook.createEvent({
    subject: title,
    startIso: newRes.start,
    endIso: newRes.end,
    attendeesEmails: [],
    body: purpose
  }).catch(() => void 0);
  return res.status(201).json({ reservation: newRes });
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.getReservations().find(r => r.id === id);
  if (!existing) return res.status(404).json({ error: 'Reservation not found' });
  db.removeReservation(id);
  return res.status(204).send();
});

export default router;
