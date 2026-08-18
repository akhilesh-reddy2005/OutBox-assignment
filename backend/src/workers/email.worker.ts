import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma } from "../db";
import { sendEmail } from "../services/mailer";
import { checkAndConsumeRateLimit } from "../services/rate-limiter";
import { emailQueue } from "../queues/email.queue";
import { reserveSendSlot } from "../services/send-throttle";

const connection = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    "email-scheduler",

    async (job) => {
        const { emailJobId } = job.data;

        console.log(`Processing email job: ${emailJobId}`);

        // 1. Find email in PostgreSQL
        const emailJob = await prisma.emailJob.findUnique({
            where: {
                id: emailJobId,
            },
        });

        if (!emailJob) {
            throw new Error(`EmailJob ${emailJobId} not found`);
        }

        // 2. Idempotency check
        if (emailJob.status === "SENT") {
            console.log(
                `EmailJob ${emailJobId} already sent. Skipping.`
            );
            return;
        }

        // 3. Check Redis-backed hourly rate limit
        const rateLimit = await checkAndConsumeRateLimit();

        if (!rateLimit.allowed) {
            const retryAt = rateLimit.retryAt!;

            console.log(
                `Hourly rate limit reached for ${emailJobId}`
            );

            console.log(
                `Rescheduling for ${retryAt.toISOString()}`
            );

            // Keep database record scheduled
            await prisma.emailJob.update({
                where: {
                    id: emailJobId,
                },
                data: {
                    status: "SCHEDULED",
                    scheduledAt: retryAt,
                },
            });

            // Create a new delayed BullMQ job
            await emailQueue.add(
                "send-email",
                {
                    emailJobId,
                },
                {
                    jobId: `${emailJobId}-retry-${retryAt.getTime()}`,
                    delay: Math.max(
                        0,
                        retryAt.getTime() - Date.now()
                    ),
                    removeOnComplete: false,
                    removeOnFail: false,
                }
            );

            console.log(
                `Email ${emailJobId} rescheduled successfully`
            );

            return;
        }

        // 4. Reserve a global send slot
        //
        // This ensures that even with multiple workers,
        // emails are sent at least MIN_DELAY_BETWEEN_EMAILS_MS
        // apart.
        const sendSlot = await reserveSendSlot();

        const waitTime = sendSlot - Date.now();

        if (waitTime > 0) {
            console.log(
                `Waiting ${waitTime}ms before sending ${emailJobId}`
            );

            await new Promise<void>((resolve) =>
                setTimeout(resolve, waitTime)
            );
        }

        // 5. Mark as PROCESSING
        await prisma.emailJob.update({
            where: {
                id: emailJobId,
            },
            data: {
                status: "PROCESSING",
                attempts: {
                    increment: 1,
                },
            },
        });

        console.log(
            `Email job ${emailJobId} is now processing`
        );

        console.log(
            `Recipient: ${emailJob.recipient}`
        );

        console.log(
            `Subject: ${emailJob.subject}`
        );

        // 6. Send email
        try {
            const result = await sendEmail(
                emailJob.recipient,
                emailJob.subject,
                emailJob.body
            );

            console.log("Email sent successfully");

            console.log(
                "Message ID:",
                result.messageId
            );

            console.log(
                "Preview URL:",
                result.previewUrl
            );

            // 7. Mark as SENT
            await prisma.emailJob.update({
                where: {
                    id: emailJobId,
                },
                data: {
                    status: "SENT",
                    sentAt: new Date(),
                    error: null,
                },
            });

            console.log(
                `Email job ${emailJobId} marked as SENT`
            );
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Unknown email sending error";

            console.error(
                `Email job ${emailJobId} failed:`,
                errorMessage
            );

            // 8. Mark as FAILED
            await prisma.emailJob.update({
                where: {
                    id: emailJobId,
                },
                data: {
                    status: "FAILED",
                    error: errorMessage,
                },
            });

            // Let BullMQ know that the job failed
            throw error;
        }
    },

    {
        connection,
        concurrency:
            Number(process.env.WORKER_CONCURRENCY) || 5,
    }
);

// Worker completed
worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

// Worker failed
worker.on("failed", (job, error) => {
    console.error(
        `Job ${job?.id} failed:`,
        error.message
    );
});

console.log("Email worker started");