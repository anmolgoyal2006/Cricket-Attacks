import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
// Render auto-deploy test
import { connectDatabase } from './config/database';
import routes from './routes';
import cricbuzzRoutes from './routes/cricbuzzRoutes';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { setupSocketServer } from './socket';

const app = express();
const httpServer = http.createServer(app);

app.set('trust proxy', 1);

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://cricket-attacks.vercel.app',
    'https://cricket-attacks-biwdbejwt-anmolgoyal2006s-projects.vercel.app',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/cricbuzz', cricbuzzRoutes);
app.use('/api', routes);

app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

app.use(errorHandler);

async function start() {
  await connectDatabase();

  setupSocketServer(httpServer);

  httpServer.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`WebSocket running on ws://localhost:${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
  });
}

start().catch(console.error);

export default app;
