import "dotenv/config";
import IORedis from "ioredis";

const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

const MAX_EMAILS_PER_HOUR = Number(
    process.env.MAX_EMAILS_PER_HOUR || 50
);

const RATE_LIMIT_SCRIPT = `
local current = redis.call("GET", KEYS[1])

if not current then
    redis.call("SET", KEYS[1], 1, "EX", 7200)
    return 1
end

current = tonumber(current)

if current < tonumber(ARGV[1]) then
    redis.call("INCR", KEYS[1])
    return current + 1
end

return 0
`;

export async function checkAndConsumeRateLimit(): Promise<{
    allowed: boolean;
    retryAt?: Date;
}> {
    const now = new Date();

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const hour = String(now.getUTCHours()).padStart(2, "0");

    const key = `email-rate:${year}-${month}-${day}-${hour}`;

    const result = await redis.eval(
        RATE_LIMIT_SCRIPT,
        1,
        key,
        MAX_EMAILS_PER_HOUR
    );

    const count = Number(result);

    if (count > 0) {
        return {
            allowed: true,
        };
    }

    const retryAt = new Date(now);
    retryAt.setUTCMinutes(0, 0, 0);
    retryAt.setUTCHours(retryAt.getUTCHours() + 1);

    return {
        allowed: false,
        retryAt,
    };
}