import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
}

export function createToken(userId: string): string {
    return jwt.sign(
        {
            userId,
        },
        JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
}

export function verifyToken(token: string): {
    userId: string;
} {
    return jwt.verify(token, JWT_SECRET) as {
        userId: string;
    };
}

export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string): boolean {
    try {
        const [salt, hash] = storedValue.split(":");
        if (!salt || !hash) return false;
        const testHash = crypto.scryptSync(password, salt, 64).toString("hex");
        return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(testHash, "hex"));
    } catch {
        return false;
    }
}