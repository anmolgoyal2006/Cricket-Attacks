import http from 'http';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import { connectDatabase } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { setupSocketServer } from './socket';

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
  config.frontendUrl.replace(/\/$/, ''),
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(generalLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

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
