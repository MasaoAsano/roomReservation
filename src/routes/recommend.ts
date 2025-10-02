import { Router } from 'express';
import { z } from 'zod';
import { db } from '../store/memoryStore';
import { recommendRooms } from '../services/recommendation';

const router = Router();

const schema = z.object({
  durationMinutes: z.number().min(15).max(120).multipleOf(15),
  attendees: z.number().min(1),
  requiredEquipment: z.array(z.enum(['projector','tvconf','whiteboard'])).default([]),
  startFrom: z.string().datetime()
});

router.post('/', (req, res) => {
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { durationMinutes, attendees, requiredEquipment, startFrom } = parse.data;

  const results = recommendRooms(
    {
      durationMinutes,
      attendees,
      requiredEquipment: new Set(requiredEquipment),
      startFrom: new Date(startFrom)
    },
    db.getRooms(),
    db.getReservations()
  );

  return res.json({ candidates: results.map(r => ({ room: r.room, score: r.score })) });
});

export default router;
