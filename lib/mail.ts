import "server-only";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** SMTP is configured when SMTP_HOST (plus SMTP_USER/SMTP_PASS for authenticated servers like Gmail) is set. */
export const smtpConfigured = () => !!process.env.SMTP_HOST;

/**
 * Sends through SMTP using SMTP_HOST / SMTP_PORT / SMTP_SECURE / SMTP_USER / SMTP_PASS.
 * Without SMTP_HOST the message is printed to the server log instead, so local dev needs no setup.
 * Returns true only if the mail server accepted the message.
 */
export async function sendMail(to: string, subject: string, text: string, action?: { label: string; url: string }): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.log(`\n[mail:not-configured] to=${to}\n${subject}\n${text}\n`);
    return false;
  }
  const secure = (process.env.SMTP_SECURE ?? "").toLowerCase() === "true";
  const port = Number(process.env.SMTP_PORT) || (secure ? 465 : 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#141312">
  <p style="font:12px monospace;color:#8d887f;margin:0">DEEPA · STUDIO</p>
  ${text.split("\n\n").map((p) => `<p style="line-height:1.55">${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}
  ${action ? `<p><a href="${esc(action.url)}" style="display:inline-block;background:#141312;color:#f6f3ec;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">${esc(action.label)}</a></p>
  <p style="font-size:12px;color:#8d887f;word-break:break-all">Atau salin link ini: ${esc(action.url)}</p>` : ""}
</div>`;
  try {
    const { createTransport } = await import("nodemailer");
    // port 465 = implicit TLS (SMTP_SECURE=true); 587 = STARTTLS (SMTP_SECURE=false)
    const transport = createTransport({ host, port, secure, auth: user && pass ? { user, pass } : undefined });
    await transport.sendMail({
      from: process.env.CONTACT_EMAIL_FROM || user || "DEEPA Studio <no-reply@localhost>",
      to,
      subject,
      text: action ? `${text}\n\n${action.url}` : text,
      html,
    });
    return true;
  } catch (e) {
    console.error("[mail] failed to send:", e instanceof Error ? e.message : e);
    return false;
  }
}
