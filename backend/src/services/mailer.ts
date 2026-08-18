import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.ETHEREAL_HOST,
    port: Number(process.env.ETHEREAL_PORT),
    secure: process.env.ETHEREAL_SECURE === "true",
    auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASSWORD,
    },
});

export async function sendEmail(
    recipient: string,
    subject: string,
    body: string
) {
    const info = await transporter.sendMail({
        from: `"ReachInbox" <${process.env.ETHEREAL_USER}>`,
        to: recipient,
        subject,
        text: body,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log("Email sent successfully");
    console.log("Message ID:", info.messageId);

    if (previewUrl) {
        console.log("Preview URL:", previewUrl);
    }

    return {
        messageId: info.messageId,
        previewUrl,
    };
}