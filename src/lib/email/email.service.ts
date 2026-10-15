import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { TSendEmailTemplate } from '../../schemas/emails.schema.js';

@Injectable()
export class EmailService {
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async sendWithTemplate(data: TSendEmailTemplate): Promise<void> {
    const response = await this.client.emails.send(
      {
        to: [data.to],
        template: {
          id: data.template.id,
          variables: data.template.variables,
        },
        attachments: data.attachments,
        scheduledAt: data.scheduledAt,
        headers: data.unsubscribeUrl
          ? {
              'List-Unsubscribe': `<${data.unsubscribeUrl}>, <mailto:unsubscribe@ghumbo.com?subject=unsubscribed>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            }
          : {},
      },
      {
        idempotencyKey: data.idempotencyKey,
      },
    );

    if (response.error) {
      throw response.error;
    }
  }
}
