import { redis } from './redis';

export const getCache = async (key: string) => {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Cache retrieval error:", error);
        return null;
    }
};

export const setCache = async (key: string, value: any, ttl: number) => {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
        console.error("Cache set error:", error);
    }
};

export const clearCache = async (key: string) => {
    try {
        await redis.del(key);
    } catch (error) {
        console.error("Cache clear error:", error);
    }
};
