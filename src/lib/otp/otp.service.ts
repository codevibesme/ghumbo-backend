import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { CacheService } from '../cache/cache.service.js';
import {
  Challenge,
  EOtpChannel,
  TChallengeContext,
  TCreateChallenge,
  TCreateChallengeResponse,
} from '../../schemas/otp.schema.js';
import { EEMAIL_TEMPLATES } from '../../schemas/emails.schema.js';
import {
  formatDateTimeIST,
  formatTimeIST,
} from '../../utilities/date-format.js';
import { QueueService } from '../queue/queue.service.js';
import { QUEUES } from '../queue/queue.config.js';

@Injectable()
export class OtpService {
  private readonly OTP_TTL = 300;
  private readonly OTP_RESEND_COOLDOWN = 60;
  private readonly MAX_REQ_PER_HOUR = 10;

  constructor(
    private readonly queueService: QueueService,
    private readonly cacheService: CacheService,
  ) {}

  private getOtpKey(challengeId: string) {
    return `otp:${challengeId}`;
  }

  private generateOtp(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private getCooldownKey(destination: string): string {
    return `otp:cooldown:${destination}`;
  }

  private getMaxReqKey(destination: string): string {
    return `otp:maxReq:${destination}`;
  }

  private hashOtp(challengeId: string, otp: string): string {
    return createHmac('sha256', process.env.OTP_SECRET!)
      .update(`${challengeId}:${otp}`)
      .digest('hex');
  }

  private async resetChallengeCache(destination: string, challengeId: string) {
    await Promise.allSettled([
      this.cacheService.del(this.getOtpKey(challengeId)),
      this.cacheService.decr(this.getMaxReqKey(destination)),
      this.cacheService.del(this.getCooldownKey(destination)),
    ]);
  }

  async createChallenge(
    opts: TCreateChallenge,
  ): Promise<TCreateChallengeResponse> {
    const cooldownKey = this.getCooldownKey(opts.destination);
    const acquired = await this.cacheService.setIfNotExists(
      cooldownKey,
      '1',
      this.OTP_RESEND_COOLDOWN,
    );
    if (!acquired) {
      throw new HttpException(
        {
          message: 'Please wait before requesting another code.',
          resendAfter: await this.cacheService.expiresAt(cooldownKey),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const maxReqKey = this.getMaxReqKey(opts.destination);
    const maxReqPerHour = await this.cacheService.incr(maxReqKey, 3600);

    if (maxReqPerHour > this.MAX_REQ_PER_HOUR) {
      throw new HttpException(
        {
          message: 'Too many codes requested. Try again later.',
          resendAfter: await this.cacheService.expiresAt(maxReqKey),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const challengeId = randomUUID();
    const otp = this.generateOtp();
    const otpHash = this.hashOtp(challengeId, otp);
    const challengeKey = this.getOtpKey(challengeId);

    const payload = Challenge.parse({
      channel: opts.channel,
      destination: opts.destination,
      otpHash,
      context: opts.context,
    });

    await this.cacheService.set(
      challengeKey,
      JSON.stringify(payload),
      this.OTP_TTL,
    );

    try {
      await this.deliverOtp(opts.channel, opts.destination, challengeId, otp);
    } catch (err: any) {
      await this.resetChallengeCache(opts.destination, challengeId);
      throw new BadRequestException(
        `Failed to deliver OTP, please try again. ${err.message}`,
      );
    }

    return {
      challengeId,
      expiresIn: this.OTP_TTL,
      resendAfter: this.OTP_RESEND_COOLDOWN,
    };
  }

  async validateOtp(
    challengeId: string,
    otp: string,
  ): Promise<TChallengeContext> {
    const challengeKey = this.getOtpKey(challengeId);

    const raw = await this.cacheService.get(challengeKey);
    if (!raw) {
      throw new BadRequestException('OTP is invalid/expired.');
    }

    const challenge = Challenge.parse(JSON.parse(raw));
    const attempts = await this.cacheService.incr(
      `otp:${challengeId}:attempts`,
      this.OTP_TTL,
    );

    if (attempts > 3) {
      throw new BadRequestException('Max retries reached. Try again later.');
    }

    const currentOtpHash = Buffer.from(this.hashOtp(challengeId, otp), 'hex');
    const storedOtpHash = Buffer.from(challenge.otpHash, 'hex');
    if (
      currentOtpHash.length === storedOtpHash.length &&
      timingSafeEqual(currentOtpHash, storedOtpHash)
    ) {
      const res = await this.cacheService.del(challengeKey);
      if (res !== 1) throw new BadRequestException('Validation failed');

      return challenge.context;
    }

    throw new UnauthorizedException('OTP mismatch');
  }

  private async deliverOtp(
    channel: EOtpChannel,
    destination: string,
    challengeId: string,
    otp: string,
  ) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.OTP_TTL * 1000);
    const idempotencyKey = this.getOtpKey(challengeId);

    if (channel === EOtpChannel.EMAIL) {
      await this.queueService.notify(QUEUES.NOTIFICATION.name, {
        id: randomUUID(),
        body: {
          type: 'NOTIFICATION',
          eventType: 'auth-challenge',
          idempotencyKey,
          data: {
            channel: 'email',
            destination,
            idempotencyKey,
            payload: {
              to: destination,
              template: {
                id: EEMAIL_TEMPLATES.AUTH_SIGN_IN_CODE,
                variables: {
                  ACCOUNT_EMAIL: destination,
                  CODE: otp,
                  EXPIRES_AT: formatTimeIST(expiresAt),
                  REQUESTED_AT: formatDateTimeIST(now),
                },
              },
              idempotencyKey,
            },
          },
        },
      });
    } else if (channel === EOtpChannel.PHONE) {
      // send sms
    } else {
      throw new UnprocessableEntityException(
        'Otp channel not supported. Should be either email or phone',
      );
    }
  }
}
