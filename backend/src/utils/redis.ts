import Redis from "ioredis";
import colors from "colors";
import { REDIS_URL } from "../config";

let redisClient: Redis | null = null;

const createRedisClient = () => {
    if (!REDIS_URL) {
        throw new Error(colors.bgRed.white(`REDIS_URL is not defined`));
    }

    if (!redisClient) {
        redisClient = new Redis(REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 3,
            retryStrategy: (attempt) => {
                if (attempt > 3) {
                    console.error(colors.bgRed.white(`Redis reconnect failed after 3 attempts.`));
                    return null;
                }
                console.log(colors.bgYellow.white(`Redis reconnecting... Attempt: ${attempt}`));
                return Math.min(attempt * 1000, 5000);
            },
        });

        redisClient.on("error", (err) => {
            console.error(colors.bgRed.white(`Redis connection error: ${err.message}`));
        });

        redisClient.on("connect", () => {
            console.log(colors.bgGreen.white(`Connected to Redis at ${REDIS_URL}`));
        });

        redisClient.on("reconnecting", () => {
            console.log(colors.bgYellow.white(`Redis reconnecting...`));
        });

        redisClient.connect().catch((err) => {
            console.error(colors.bgRed.white(`Redis initial connection failed: ${err.message}`));
        });
    }

    return redisClient;
};

export const redis = createRedisClient();
