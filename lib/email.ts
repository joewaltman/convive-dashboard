import { Resend } from 'resend';
import type { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<SendEmailResult> {
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'joe@con-vive.com';

  try {
    const { data, error } = await resend.emails.send({
      from: `Joe from Con-Vive <${fromAddress}>`,
      to,
      subject,
      react,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Email send error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
