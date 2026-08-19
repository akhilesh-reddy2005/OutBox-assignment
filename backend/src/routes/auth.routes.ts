import { Router, Request, Response } from "express";
import { z } from "zod";
import passport from "../config/passport";
import { createToken, hashPassword, verifyPassword } from "../services/auth.service";
import { prisma } from "../db";
import { requireAuth, AuthenticatedRequest } from "../middleware/auth.middleware";

const router = Router();

/**
 * Start Google OAuth
 */
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);

/**
 * Google OAuth callback
 */
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    }),
    (req: Request, res: Response) => {
        const user = req.user as {
            id: string;
        };

        const token = createToken(user.id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.redirect(
            `${process.env.FRONTEND_URL}/dashboard`
        );
    }
);

/**
 * Get current logged-in user
 */
router.get(
    "/me",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: req.userId!,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            return res.json({
                success: true,
                user,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch user",
            });
        }
    }
);

const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required"),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address"),

    password: z
        .string()
        .min(1, "Password is required"),
});

/**
 * Register with Email + Password
 */
router.post("/register", async (req: Request, res: Response) => {
    try {
        const body = registerSchema.safeParse(req.body);
        if (!body.success) {
            return res.status(400).json({
                success: false,
                message: body.error.issues[0]?.message || "Validation failed",
            });
        }

        const { name, email, password } = body.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email is already registered",
            });
        }

        const hashedPassword = hashPassword(password);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        const token = createToken(user.id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during registration",
        });
    }
});

/**
 * Login with Email + Password
 */
router.post("/login", async (req: Request, res: Response) => {
    try {
        const body = loginSchema.safeParse(req.body);
        if (!body.success) {
            return res.status(400).json({
                success: false,
                message: body.error.issues[0]?.message || "Validation failed",
            });
        }

        const { email, password } = body.data;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user || !user.password || !verifyPassword(password, user.password)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = createToken(user.id);

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login",
        });
    }
});

/**
 * Logout
 */
router.post("/logout", (_req: Request, res: Response) => {
    res.clearCookie("token");

    return res.json({
        success: true,
        message: "Logged out successfully",
    });
});

export default router;