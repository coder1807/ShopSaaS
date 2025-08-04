import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '@packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';
import router from './routes/auth.router';
import swaggerUi from 'swagger-ui-express';

const app = express();
const swaggerDocument = require('./swagger-output.json');

app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Only allow frontend at port 3000 and 3001
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow json or form data, authorize allow send token (JWT)
    credentials: true, // Allow cookies to be sent
  })
);

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/docs-json', (req, res) => {
  res.json(swaggerDocument);
});

// Routes
app.use('/api', router);

app.use(errorMiddleware);

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}/api`);
  console.log(`API Docs available at http://localhost:${port}/api-docs`);
  console.log(`Swagger Docs available at http://localhost:${port}/docs`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
