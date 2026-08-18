import "dotenv/config";
import IORedis from "ioredis";

const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

const MIN_DELAY_MS = Number(
    process.env.MIN_DELAY_BETWEEN_EMAILS_MS || 2000
);

/**
 * Atomically reserves the next available global email-send slot.
 *
 * Multiple workers can call this simultaneously.
 * Redis ensures each worker gets a different slot.
 */
const RESERVE_SLOT_SCRIPT = `
local current = redis.call("GET", KEYS[1])
local now = tonumber(ARGV[1])
local delay = tonumber(ARGV[2])

if not current then
    local next = now + delay
    redis.call("SET", KEYS[1], next)
    return now
end

local nextAvailable = tonumber(current)

if nextAvailable <= now then
    local next = now + delay
    redis.call("SET", KEYS[1], next)
    return now
end

local reserved = nextAvailable
local next = nextAvailable + delay

redis.call("SET", KEYS[1], next)

return reserved
`;

export async function reserveSendSlot(): Promise<number> {
    const now = Date.now();

    const result = await redis.eval(
        RESERVE_SLOT_SCRIPT,
        1,
        "email-send-next-slot",
        now,
        MIN_DELAY_MS
    );

    return Number(result);
}