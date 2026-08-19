import jwt from "jsonwebtoken";
import crypto from "crypto";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
    throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET: string = rawSecret;

export interface TokenPayload {
    userId: string;
}

function isTokenPayload(payload: unknown): payload is TokenPayload {
    return (
        typeof payload === "object" &&
        payload !== null &&
        "userId" in payload &&
        typeof (payload as { userId: unknown }).userId === "string"
    );
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

export function verifyToken(token: string): TokenPayload {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isTokenPayload(decoded)) {
        throw new Error("Invalid or corrupted token payload");
    }
    return decoded;
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