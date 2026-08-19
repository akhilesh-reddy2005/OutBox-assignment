import "dotenv/config";
import IORedis from "ioredis";

const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

/**
 * Atomically checks and increments the per-user hourly send counter.
 *
 * Redis key: email-rate:{userId}:{YYYY-MM-DD-HH} (UTC)
 * TTL = 7200s (2 hours) so keys auto-expire after the window passes.
 *
 * Returns count > 0 when allowed, 0 when the limit is reached.
 */
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

export async function checkAndConsumeRateLimit(
    userId: string,
    hourlyLimit: number
): Promise<{
    allowed: boolean;
    retryAt?: Date;
}> {
    const now = new Date();

    const year  = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day   = String(now.getUTCDate()).padStart(2, "0");
    const hour  = String(now.getUTCHours()).padStart(2, "0");

    // Per-user, per-hour key — completely isolated between users
    const key = `email-rate:${userId}:${year}-${month}-${day}-${hour}`;

    const result = await redis.eval(
        RATE_LIMIT_SCRIPT,
        1,
        key,
        hourlyLimit
    );

    const count = Number(result);

    if (count > 0) {
        return { allowed: true };
    }

    // Round up to the start of the next UTC hour
    const retryAt = new Date(now);
    retryAt.setUTCMinutes(0, 0, 0);
    retryAt.setUTCHours(retryAt.getUTCHours() + 1);

    return { allowed: false, retryAt };
}