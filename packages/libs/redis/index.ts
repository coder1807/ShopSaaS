import Redis from 'ioredis';

const redisUri = process.env.REDIS_DATABASE_URI;
if (!redisUri) {
  throw new Error('REDIS_DATABASE_URI environment variable is required');
}
const redis = new Redis(redisUri);

export default redis;
