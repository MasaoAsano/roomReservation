import express from 'express';
import cors from 'cors';
import recommendRouter from './routes/recommend';
import reservationsRouter from './routes/reservations';
import { db } from './store/memoryStore';
import { seedRooms } from './store/seed';

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:3001'],
  methods: ['GET','POST','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// seed rooms at startup
if (db.getRooms().length === 0) {
  db.setRooms(seedRooms);
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/recommend', recommendRouter);
app.use('/api/reservations', reservationsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
