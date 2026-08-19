import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(
    recipient: string,
    subject: string,
    body: string
) {
    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "ReachInbox <onboarding@resend.dev>",
        to: [recipient],
        subject,
        text: body,
    });

    if (error) {
        throw new Error(error.message);
    }

    if (!data?.id) {
        throw new Error("Email provider did not return a message ID");
    }

    return {
        messageId: data.id,
        previewUrl: null,
    };
}