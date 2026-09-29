import nodemailer, { type Transporter } from 'nodemailer';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  publicSiteUrl: string;
}

export class SmtpConfigError extends Error {
  readonly code = 'SMTP_NOT_CONFIGURED';

  constructor(message: string) {
    super(message);
    this.name = 'SmtpConfigError';
  }
}

export function readSmtpConfig(env: NodeJS.ProcessEnv = process.env): SmtpConfig {
  const host = env.SMTP_HOST?.trim();
  const fromName = env.SMTP_FROM_NAME?.trim() || 'Jov3';
  const fromEmail = env.SMTP_FROM_EMAIL?.trim().toLowerCase();
  const publicSiteUrl = env.PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  const port = Number(env.SMTP_PORT || 587);
  const secure = parseBoolean(env.SMTP_SECURE, port === 465);
  const user = env.SMTP_USER?.trim() || undefined;
  const password = env.SMTP_PASSWORD || undefined;

  if (!host) throw new SmtpConfigError('SMTP_HOST is required');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new SmtpConfigError('SMTP_PORT must be a valid TCP port');
  }
  if (!fromEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fromEmail)) {
    throw new SmtpConfigError('SMTP_FROM_EMAIL must be a valid email address');
  }
  if (!publicSiteUrl) throw new SmtpConfigError('PUBLIC_SITE_URL is required');
  if ((user && !password) || (!user && password)) {
    throw new SmtpConfigError('SMTP_USER and SMTP_PASSWORD must be configured together');
  }

  return { host, port, secure, user, password, fromName, fromEmail, publicSiteUrl };
}

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}

export class SmtpEmailSender implements EmailSender {
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth:
        config.user && config.password ? { user: config.user, pass: config.password } : undefined,
    });
  }

  async send(message: EmailMessage) {
    await this.transporter.sendMail({
      from: { name: this.config.fromName, address: this.config.fromEmail },
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}

export function createSmtpEmailSender(env: NodeJS.ProcessEnv = process.env) {
  const config = readSmtpConfig(env);
  return { sender: new SmtpEmailSender(config), config };
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined || value.trim() === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}
