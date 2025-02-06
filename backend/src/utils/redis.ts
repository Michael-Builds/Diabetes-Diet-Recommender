import Redis from "ioredis";
import { REDIS_URL } from "../config";
import colors from 'colors';


const redis_url = REDIS_URL || "redis://127.0.0.1:6379";

const createRedisClient = () => {
    if (!redis_url) {
        throw new Error(colors.bgRed.white(`Redis connection failed: REDIS_URL is not defined`));
    }

    try {
        // console.log(colors.bgMagenta.white(`Connecting to Redis at ${REDIS_URL}`));
        const client = new Redis(redis_url);

        client.on('error', (err) => {
            console.error(colors.bgRed.white(`Redis connection error: ${err.message}`));
        });

        client.on('connect', () => {
            console.log(colors.bgMagenta.white(`Connected to Redis at ${REDIS_URL}`));
        });

        return client;
    } catch (error: any) {
        console.error(colors.bgRed.white(`Failed to create Redis client: ${error.message}`));
        throw error;
    }
};

export const redis = createRedisClient();
