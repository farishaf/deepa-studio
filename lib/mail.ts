import "server-only";

/**
 * Sends via SMTP when SMTP_URL is set (e.g. smtp://user:pass@smtp.example.com:587).
 * Otherwise the message is printed to the server log, so everything works with zero setup.
 */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const url = process.env.SMTP_URL;
  if (!url) {
    console.log(`\n[mail:not-configured] to=${to}\n${subject}\n${text}\n`);
    return false;
  }
  try {
    const { createTransport } = await import("nodemailer");
    await createTransport(url).sendMail({
      from: process.env.MAIL_FROM ?? "DEEPA Studio <no-reply@localhost>",
      to,
      subject,
      text,
    });
    return true;
  } catch (e) {
    console.error("[mail] failed to send", e);
    return false;
  }
}
