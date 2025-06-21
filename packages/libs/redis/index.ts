import Redis from 'ioredis';

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const redis = new Redis(process.env.REDIS_DATABASE_URI!);

export default redis;
