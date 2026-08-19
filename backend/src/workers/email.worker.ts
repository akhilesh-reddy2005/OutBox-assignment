import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "../db";
import { sendEmail } from "../services/mailer";
import { checkAndConsumeRateLimit } from "../services/rate-limiter";
import { emailQueue } from "../queues/email.queue";
import { waitForSendSlot, notifySendComplete } from "../services/send-throttle";

const connection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

// ─────────────────────────────────────────────────────────────────────────────
// concurrency: 1 — strictly one email in-flight at any time.
//
// BullMQ will not dequeue the next job until the current processor function
// has returned (resolved or rejected).  Combined with the post-send slot
// update in notifySendComplete(), this guarantees:
//
//   [SEND START 1] → sendEmail() → [SEND COMPLETE 1]
//        → wait(remaining delayMs) → [SEND START 2] → ...
//
// With concurrency > 1 two SMTP calls would overlap, breaking the guarantee.
// ─────────────────────────────────────────────────────────────────────────────

const worker = new Worker(
    "email-scheduler",

    async (job) => {
        const { emailJobId } = job.data;

        console.log(`[QUEUE] Processing: ${emailJobId}`);

        // ─────────────────────────────────────────────────────────────────
        // STEP 1 — Fetch EmailJob from PostgreSQL
        // ─────────────────────────────────────────────────────────────────
        const emailJob = await prisma.emailJob.findUnique({
            where: { id: emailJobId },
        });

        if (!emailJob) {
            console.warn(`[QUEUE] ${emailJobId} not found in DB — skipping`);
            return;
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 2 — Fast-path idempotency check (read-only)
        // ─────────────────────────────────────────────────────────────────
        if (emailJob.status === "SENT") {
            console.log(`[IDEMPOTENCY] ${emailJobId} already SENT — skipping`);
            return;
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 3 — Per-user hourly rate limit (Redis Lua, atomic)
        // ─────────────────────────────────────────────────────────────────
        const userId = emailJob.userId ?? "anonymous";
        const rateLimit = await checkAndConsumeRateLimit(
            userId,
            emailJob.hourlyLimit
        );

        if (!rateLimit.allowed) {
            const retryAt = rateLimit.retryAt!;

            console.log(
                `[RATE] ${emailJobId} — hourly limit reached ` +
                `(limit=${emailJob.hourlyLimit}). ` +
                `Rescheduling for ${retryAt.toISOString()}`
            );

            await prisma.emailJob.update({
                where: { id: emailJobId },
                data: {
                    status: "SCHEDULED",
                    scheduledAt: retryAt,
                },
            });

            // Deterministic job ID prevents duplicate delayed jobs
            await emailQueue.add(
                "send-email",
                { emailJobId },
                {
                    jobId: `${emailJobId}-retry-${retryAt.getTime()}`,
                    delay: Math.max(0, retryAt.getTime() - Date.now()),
                    removeOnComplete: false,
                    removeOnFail: false,
                }
            );

            console.log(`[RATE] ${emailJobId} rescheduled to ${retryAt.toISOString()}`);
            return;
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 4 — Wait for the global send slot.
        //
        // `waitForSendSlot` reads the Redis cursor set by the PREVIOUS
        // job's `notifySendComplete` call and sleeps until that time.
        //
        // Because concurrency=1, this runs only after the previous job's
        // processor function has fully returned — so the slot is already
        // written before we read it here.
        // ─────────────────────────────────────────────────────────────────
        const slotTime = await waitForSendSlot(emailJob.delayMs);
        const waitMs   = slotTime - Date.now();

        console.log(
            `[SLOT] ${emailJobId} next slot ${new Date(slotTime).toISOString()} ` +
            `(delayMs=${emailJob.delayMs})`
        );

        if (waitMs > 0) {
            console.log(`[WAIT] ${emailJobId} waiting ${waitMs}ms`);
            await new Promise<void>((resolve) => setTimeout(resolve, waitMs));
        }

        // ─────────────────────────────────────────────────────────────────
        // STEP 5 — Atomic claim: SCHEDULED → PROCESSING
        //
        // PostgreSQL UPDATE ... WHERE status = 'SCHEDULED' ensures only
        // one writer succeeds even under concurrent workers (future-proof).
        // ─────────────────────────────────────────────────────────────────
        const sendStartedAt = new Date();

        const claimed = await prisma.emailJob.updateMany({
            where: {
                id: emailJobId,
                status: "SCHEDULED",    // only one worker wins this
            },
            data: {
                status: "PROCESSING",
                attempts: { increment: 1 },
                sendStartedAt,
            },
        });

        if (claimed.count === 0) {
            const current = await prisma.emailJob.findUnique({
                where: { id: emailJobId },
                select: { status: true },
            });

            if (current?.status === "SENT") {
                console.log(`[IDEMPOTENCY] ${emailJobId} already SENT — skipping`);
            } else if (current?.status === "PROCESSING") {
                console.log(`[IDEMPOTENCY] ${emailJobId} already claimed by another worker — skipping`);
            } else {
                console.warn(
                    `[IDEMPOTENCY] ${emailJobId} could not be claimed ` +
                    `(status=${current?.status ?? "unknown"}) — skipping`
                );
            }
            return;
        }

        console.log(`[IDEMPOTENCY] ${emailJobId} successfully claimed`);

        // ─────────────────────────────────────────────────────────────────
        // STEP 6 — Send email via Ethereal SMTP
        // ─────────────────────────────────────────────────────────────────
        console.log(
            `[SEND START] ${emailJobId} ` +
            `recipient=${emailJob.recipient} ` +
            `time=${sendStartedAt.toISOString()}`
        );

        try {
            const result = await sendEmail(
                emailJob.recipient,
                emailJob.subject,
                emailJob.body
            );

            const sentAt = new Date();

            await prisma.emailJob.update({
                where: { id: emailJobId },
                data: {
                    status: "SENT",
                    sentAt,
                    error: null,
                },
            });

            console.log(
                `[SEND COMPLETE] ${emailJobId} ` +
                `recipient=${emailJob.recipient} ` +
                `time=${sentAt.toISOString()} ` +
                `messageId=${result.messageId}`
            );
            console.log(`[PREVIEW] ${result.previewUrl}`);

        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown email sending error";

            await prisma.emailJob.update({
                where: { id: emailJobId },
                data: {
                    status: "FAILED",
                    error: errorMessage,
                },
            });

            console.error(
                `[SEND FAILED] ${emailJobId} ` +
                `recipient=${emailJob.recipient} ` +
                `error=${errorMessage}`
            );

            // Re-throw so BullMQ records the job as failed
            throw error;

        } finally {
            // ─────────────────────────────────────────────────────────────
            // STEP 7 — Post-send: update Redis cursor to now + delayMs.
            //
            // This runs in `finally` so it fires on BOTH success and failure.
            // The next job's waitForSendSlot() will sleep until this time,
            // guaranteeing SEND COMPLETE → delayMs → SEND START ordering.
            // ─────────────────────────────────────────────────────────────
            await notifySendComplete(emailJob.delayMs);
            console.log(
                `[THROTTLE] ${emailJobId} next slot pushed by ${emailJob.delayMs}ms`
            );
        }
    },

    {
        connection,
        concurrency: 1,   // strictly one email in-flight at any time
    }
);

worker.on("completed", (job) => {
    console.log(`[JOB] ${job.id} completed`);
});

worker.on("failed", (job, error) => {
    console.error(`[JOB] ${job?.id} failed: ${error.message}`);
});

console.log("Email worker started (concurrency=1, strictly sequential)");