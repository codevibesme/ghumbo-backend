import {
  Controller,
  Headers,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { BillingService } from '../billings/billings.service.js';

@Controller('webhooks')
@ApiTags('webhooks')
export class WebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post('/billing/razorpay')
  @ApiExcludeEndpoint()
  @ApiOkResponse({ description: 'OK' })
  async billing(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-event-id') eventId: string,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    await this.billingService.handleWebhookEvents(
      eventId,
      req.rawBody!.toString('utf-8'),
      signature,
    );

    return { status: 'OK' };
  }
}
