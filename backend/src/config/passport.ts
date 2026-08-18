import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../db";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL:
                process.env.GOOGLE_CALLBACK_URL ||
                "http://localhost:5000/api/auth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const googleId = profile.id;

                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(
                        new Error("Google account does not have an email")
                    );
                }

                const name =
                    profile.displayName ||
                    profile.name?.givenName ||
                    "ReachInbox User";

                const avatar =
                    profile.photos?.[0]?.value || null;

                let user = await prisma.user.findUnique({
                    where: {
                        googleId,
                    },
                });

                if (user) {
                    user = await prisma.user.update({
                        where: {
                            id: user.id,
                        },
                        data: {
                            name,
                            email,
                            avatar,
                        },
                    });
                } else {
                    user = await prisma.user.findUnique({
                        where: {
                            email,
                        },
                    });

                    if (user) {
                        user = await prisma.user.update({
                            where: {
                                id: user.id,
                            },
                            data: {
                                googleId,
                                name,
                                avatar,
                            },
                        });
                    } else {
                        user = await prisma.user.create({
                            data: {
                                googleId,
                                name,
                                email,
                                avatar,
                            },
                        });
                    }
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error);
            }
        }
    )
);

export default passport;