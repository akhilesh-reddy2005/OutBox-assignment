import { Router } from "express";
import passport from "../config/passport";
import { createToken } from "../services/auth.service";
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
    (req, res) => {
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
    async (req: AuthenticatedRequest, res) => {
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

/**
 * Logout
 */
router.post("/logout", (_req, res) => {
    res.clearCookie("token");

    return res.json({
        success: true,
        message: "Logged out successfully",
    });
});

export default router;