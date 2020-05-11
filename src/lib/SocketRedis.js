import Redis from 'ioredis';
import configRedis from '../config/redis';

class CacheSocket {
  constructor() {
    this.redis = new Redis({ ...configRedis, keyPrefix: 'socket:' });
  }

  set(key, value) {
    const res = this.redis.set(key, JSON.stringify(value), 'EX', 60 * 60 * 6);
    return res;
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
      const keys = await this.redis.keys(`socket:${prefix}:*`);
      const keysWithoutPrefix = keys.map(key => key.replace('socket:', ''));

      this.redis.del(keysWithoutPrefix);

      return;
    } catch (error) {}
   }

  async allKey(prefix) {
    try {
      const keys = await this.redis.keys(`socket:${prefix}:*`);
      const keysWithoutPrefixx = keys.map(key => key.replace('socket:', ''));
      const cachedd = await this.redis.mget(keysWithoutPrefixx);
      const allUserConect = cachedd
        .map(p => JSON.parse(p))
        .filter(p => p !== null);

      // this.redis.disconnect();

      return allUserConect;
    } catch (error) {}
  }
}

export default new CacheSocket();
