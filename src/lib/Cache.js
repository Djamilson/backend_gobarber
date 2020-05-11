import Redis from 'ioredis';
import configRedis from '../config/redis';

class Cache {
  constructor() {
    this.redis = new Redis({ ...configRedis, keyPrefix: 'cache:' });

    this.redis.on('error', error => {
      debug('Redis connection error', error);
    });
    // Used as a diagnostic tool
  }

  set(key, value) {
    return this.redis.set(key, JSON.stringify(value), 'EX', 60 * 60 * 24);
  }

  async get(key) {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  invalidate(key) {
    return this.redis.del(key);
  }

  async invalidatePrefix(prefix) {
    try {
      const keys = await this.redis.keys(`cache:${prefix}:*`);
      const keysWithoutPrefix = keys.map(key => key.replace('cache:', ''));

      this.redis.del(keysWithoutPrefix);

      return;
    } catch (error) {}
    //this.redis.disconnect();
  }

  async allKey(prefix) {
    try {
      const keys = await this.redis.keys(`cache:${prefix}:*`);
      const keysWithoutPrefix = keys.map(key => key.replace('cache:', ''));

      return keysWithoutPrefix;
    } catch (error) {}
    //this.redis.disconnect();
  }
}

export default new Cache();
