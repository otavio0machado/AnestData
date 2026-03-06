import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import boletinsRoutes from './routes/boletins';
import patientsRoutes from './routes/patients';
import usersRoutes from './routes/users';
import conveniosRoutes from './routes/convenios';
import reportsRoutes from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true };
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/boletins', boletinsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/convenios', conveniosRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend rodando em http://localhost:${PORT}`);
  });
}

export default app;
