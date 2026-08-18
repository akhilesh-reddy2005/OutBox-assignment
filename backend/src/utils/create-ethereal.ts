import nodemailer from "nodemailer";

async function main() {
    const account = await nodemailer.createTestAccount();

    console.log("Ethereal SMTP credentials:");
    console.log("Host:", account.smtp.host);
    console.log("Port:", account.smtp.port);
    console.log("Secure:", account.smtp.secure);
    console.log("User:", account.user);
    console.log("Password:", account.pass);
}

main().catch(console.error);