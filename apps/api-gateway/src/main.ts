import express from 'express';
import * as path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import proxy from 'express-http-proxy';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import axios from 'axios';
import cookieParser from 'cookie-parser';

const app = express();

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(
  cors({
    origin: ['http://localhost:3000'], // Only allow frontend at port 3000
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow json or form data, authorize allow send token (JWT)
    credentials: true, // Allow cookies to be sent
  })
);

app.use(morgan('dev')); // Popular HTTP request logger middleware for Node.js, automatically generating logs for incoming requests
app.use(express.json({ limit: '100mb' })); // Limit request body size to 100mb to handle large payloads
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.set('trust proxy', true); // Trust the first proxy (for handling X-Forwarded-For (ip) headers)

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user ? 1000 : 100), // 1000 requests per 15 minutes for authenticated users, 100 for unauthenticated
  message: 'Too many requests, please try again later !',
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req: any) => req.ip, // Use IP address as the key for rate limiting, fallback to empty string
});

app.use(limiter);

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use('/', proxy('http://localhost:6001'));

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
