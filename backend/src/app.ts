import express from "express";
import cors from "cors";
import { emailQueue } from "./queues/email.queue";
import emailRoutes from "./routes/email.routes";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "ReachInbox backend is running",
    });
});

app.post("/api/test-queue", async (_req, res) => {
    try {
        const job = await emailQueue.add("test-email", {
            message: "Hello from ReachInbox",
        });

        res.json({
            success: true,
            jobId: job.id,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add job",
        });
    }
});

app.use("/api/emails", emailRoutes);

export default app;