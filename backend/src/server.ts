import "dotenv/config";

import passport from "./config/passport";

import app from "./app";
import authRoutes from "./routes/auth.routes";

import "./workers/email.worker";
import { prisma } from "./db";

// Authentication middleware (cookieParser already applied in app.ts)
app.use(passport.initialize());

// Authentication routes
app.use("/api/auth", authRoutes);

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
    try {
        await prisma.$connect();

        console.log("PostgreSQL connected");

        app.listen(PORT, () => {
            console.log(
                `Server running on http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Failed to connect to PostgreSQL:",
            error
        );

        process.exit(1);
    }
}

startServer();