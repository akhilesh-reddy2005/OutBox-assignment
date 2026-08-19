import "dotenv/config";
import IORedis from "ioredis";

const redis = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

/**
 * Fallback minimum delay used only when no delayMs is available
 * (e.g. legacy records created before this field was added).
 */
const FALLBACK_DELAY_MS = Number(
    process.env.MIN_DELAY_BETWEEN_EMAILS_MS || 2000
);

const SLOT_KEY = "email-send-next-slot";

/**
 * Waits until the globally reserved send slot is ready.
 *
 * With concurrency=1, this function is called sequentially.
 * It reads the current "next allowed send time" from Redis and
 * sleeps until that time is reached.
 *
 * Returns the timestamp at which the worker may begin sending.
 */
export async function waitForSendSlot(
    delayMs: number = FALLBACK_DELAY_MS
): Promise<number> {
    const raw = await redis.get(SLOT_KEY);
    const nextAllowed = raw ? Number(raw) : 0;
    const now = Date.now();

    if (nextAllowed > now) {
        return nextAllowed; // caller will sleep until this
    }

    return now;
}

/**
 * Called immediately after SMTP completes (success OR failure).
 *
 * Records "now + delayMs" as the next allowed send time so the
 * subsequent job waits the full delay from the end of THIS send.
 *
 * With concurrency=1 this is always called from one goroutine,
 * so no atomic Lua script is required.
 */
export async function notifySendComplete(
    delayMs: number = FALLBACK_DELAY_MS
): Promise<void> {
    const next = Date.now() + delayMs;
    // TTL = delayMs * 2 so the key auto-expires if the worker stops
    await redis.set(SLOT_KEY, next, "PX", delayMs * 2 + 5000);
}

/**
 * Legacy export — kept so nothing breaks if imported elsewhere.
 * Delegates to waitForSendSlot.
 *
 * @deprecated Use waitForSendSlot + notifySendComplete instead.
 */
export async function reserveSendSlot(
    delayMs: number = FALLBACK_DELAY_MS
): Promise<number> {
    return waitForSendSlot(delayMs);
}