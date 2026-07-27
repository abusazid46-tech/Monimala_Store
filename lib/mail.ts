import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password || !process.env.MAIL_FROM) {
    throw new Error("Password email service is not configured.");
  }
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass: password }
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: "Reset your Monimala Store password",
    text: `Reset your password using this secure link: ${resetUrl}\n\nThis link expires in 30 minutes. If you did not request it, ignore this email.`,
    html: `<p>Use the secure link below to reset your Monimala Store password.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes. If you did not request it, ignore this email.</p>`
  });
}
