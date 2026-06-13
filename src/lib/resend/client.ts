// Resend (transactional email) integration placeholder.
import 'server-only';

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
}

export class ResendService {
  constructor(private readonly config: ResendConfig | null) {}
  isReady(): boolean {
    return this.config !== null;
  }
  // Future: sendInvoice, sendWelcome, sendContactReply, ...
}

function loadConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !fromEmail) return null;
  return { apiKey, fromEmail };
}

export const resendService = new ResendService(loadConfig());
