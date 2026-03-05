import { Resend } from "resend";
import { env } from "std-env";

/**
 * Send email using Resend
 */
export async function sendEmail({
  user,
  subject,
  text,
}: {
  user: { email: string; name?: string };
  subject: string;
  text: string;
}) {
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL || "JS.GS <noreply@js.gs>",
      to: user.email,
      subject,
      text,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error;
  }
}
