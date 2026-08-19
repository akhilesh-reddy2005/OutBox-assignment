import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import emailRoutes from "./routes/email.routes";

const app = express();

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        message: "ReachInbox backend is running",
    });
});

app.use("/api/emails", emailRoutes);

export default app;