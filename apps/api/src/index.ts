import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRouter } from './routes';

dotenv.config();

const app = express();

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  console.log(`  Headers:`, JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`  Body:`, JSON.stringify(req.body, null, 2));
  }
  console.log(`  Query:`, JSON.stringify(req.query, null, 2));
  console.log(`  Params:`, JSON.stringify(req.params, null, 2));
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`  Response Status: ${res.statusCode}`);
    console.log(`  Response Body:`, JSON.stringify(data, null, 2));
    console.log('---');
    return originalSend.call(this, data);
  };
  
  next();
});

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*', credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', apiRouter);

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${PORT}`);
});


