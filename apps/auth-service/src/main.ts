import express from 'express';
import cors from 'cors';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { errorMiddleware } from '../../../packages/error-handler/error-middleware'; // disable eslint rule for module boundaries to allow importing from a shared package
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies to be sent
  })
);

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use(errorMiddleware);

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}/api`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
