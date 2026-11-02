import { Injectable, Logger } from '@nestjs/common';
import { TSendNotification } from '../../schemas/notifications.schema.js';
import { TSendEmailTemplate } from '../../schemas/emails.schema.js';
import { EmailService } from '../../lib/email/email.service.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly emailService: EmailService) {}

  private async sendEmail(record: TSendEmailTemplate) {
    return await this.emailService.sendWithTemplate(record);
  }

  private async sendSms() {}
  private async sendWhatsappMessage() {}
  private async sendInApp() {}

  async sendNotification(record: TSendNotification) {
    this.logger.log(
      `Sending Notification: channel: ${record.channel} | destination: ${record.destination} | key: ${record.idempotencyKey}`,
    );
    try {
      if (record.channel === 'email') {
        await this.sendEmail(record.payload);
      }

      this.logger.log(
        `Notification sent: channel: ${record.channel} | destination: ${record.destination} | key: ${record.idempotencyKey}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send notification. \nchannel: ${record.channel} | destination: ${record.destination} | key: ${record.idempotencyKey}`,
      );
      throw err;
    }
  }
}
