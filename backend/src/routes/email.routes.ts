import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { emailQueue } from "../queues/email.queue";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";

const router = Router();

const scheduleSchema = z.object({
    subject: z.string().min(1),
    body: z.string().min(1),
    emails: z.array(z.string().email()).min(1),
    startTime: z.string().datetime(),
    delayMs: z.number().int().min(1000).default(2000),
    hourlyLimit: z.number().int().positive().default(50),
});

// POST /api/emails/schedule
router.post("/schedule", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const data = scheduleSchema.parse(req.body);

        const startTime = new Date(data.startTime);

        if (startTime.getTime() <= Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Start time must be in the future",
            });
        }

        const jobs = [];

        for (let i = 0; i < data.emails.length; i++) {
            const recipient = data.emails[i]!;

            const scheduledAt = new Date(
                startTime.getTime() + i * data.delayMs
            );

            const idempotencyKey =
                `${recipient}-${scheduledAt.getTime()}-${data.subject}`;

            const emailJob = await prisma.emailJob.create({
                data: {
                    recipient,
                    subject: data.subject,
                    body: data.body,
                    scheduledAt,
                    idempotencyKey,
                    delayMs: data.delayMs,
                    hourlyLimit: data.hourlyLimit,
                    userId: req.userId!,
                },
            });

            const delay = Math.max(
                0,
                scheduledAt.getTime() - Date.now()
            );

            await emailQueue.add(
                "send-email",
                {
                    emailJobId: emailJob.id,
                },
                {
                    jobId: emailJob.id,
                    delay,
                    removeOnComplete: false,
                    removeOnFail: false,
                }
            );

            jobs.push(emailJob);
        }

        return res.status(201).json({
            success: true,
            count: jobs.length,
            jobs,
        });
    } catch (error) {
        console.error(error);

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: "Invalid request",
                errors: error.issues,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to schedule emails",
        });
    }
});

// GET /api/emails/scheduled
router.get("/scheduled", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const emails = await prisma.emailJob.findMany({
            where: {
                status: "SCHEDULED",
                userId: req.userId!,
            },
            orderBy: {
                scheduledAt: "asc",
            },
            take: 200,
        });

        return res.json({
            success: true,
            emails,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch scheduled emails",
        });
    }
});

// GET /api/emails/sent
router.get("/sent", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
        const emails = await prisma.emailJob.findMany({
            where: {
                status: {
                    in: ["SENT", "FAILED"],
                },
                userId: req.userId!,
            },
            orderBy: [
                { sentAt: "desc" },
                { createdAt: "desc" },
            ],
            take: 200,
        });

        return res.json({
            success: true,
            emails,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch sent emails",
        });
    }
});

export default router;