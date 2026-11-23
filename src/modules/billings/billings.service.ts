import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserService } from '../users/users.service.js';
import { BookingService } from '../bookings/bookings.service.js';
import { BookingTravelerService } from '../booking_travelers/booking_travlers.service.js';
import {
  CancelBookingReqDto,
  CancelBookingResDto,
  CancelQuoteResDto,
  CreateBookingReqDto,
  CreateBookingResDto,
} from './billings.dto.js';
import { ETripDepartureStatus } from '../../schemas/trip_departures.schema.js';
import { TxnHelperService } from '../../helpers/txn.service.js';
import { TripDepartureEntity } from '../../entities/trip_departures.entity.js';
import { TravelerService } from '../travelers/travelers.service.js';
import {
  EBookingRefundStatus,
  EBookingStatus,
} from '../../schemas/bookings.schema.js';
import { PaymentService } from '../../lib/payment/payment.service.js';
import { BookingEntity } from '../../entities/bookings.entity.js';
import { calculateRefundAmount } from '../../utilities/calculate-refund-amount.js';
import { TripDepartureService } from '../trip_departures/trip_departures.service.js';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly userService: UserService,
    private readonly bookingService: BookingService,
    private readonly bookingTravelerService: BookingTravelerService,
    private readonly travelerService: TravelerService,
    private readonly txn: TxnHelperService,
    private readonly paymentService: PaymentService,
    private readonly departureService: TripDepartureService,
  ) {}

  async createBooking(
    userId: string,
    record: CreateBookingReqDto,
  ): Promise<CreateBookingResDto> {
    const { id, departureId, travelerIds } = record;

    await this.userService.findByIdOrThrow(userId);
    const userTravelers = await this.travelerService.getByUserId(userId);

    if (
      !travelerIds.every((id) =>
        userTravelers.find((traveler) => traveler.id == id),
      )
    ) {
      throw new ForbiddenException(
        "Travelers don't belong to the account. Please create them",
      );
    }

    const booking = await this.txn.run(async (txnManager) => {
      const departure = await txnManager
        .getRepository(TripDepartureEntity)
        .createQueryBuilder('departure')
        .setLock('pessimistic_write')
        .where('departure.id = :departureId', { departureId })
        .andWhere('departure.status = :departureStatus', {
          departureStatus: ETripDepartureStatus.OPEN,
        })
        .getOne();

      if (!departure) {
        throw new NotFoundException('Departure not found');
      }

      const uqTravelerIds = travelerIds.filter(
        (id, index, arr) => arr.findIndex((item) => item === id) === index,
      );
      const travelerCount = uqTravelerIds.length;

      if (departure.bookedSeats + travelerCount > departure.capacity) {
        throw new ConflictException(
          'Trip is fully booked. Please try some other date!',
        );
      }

      departure.bookedSeats += travelerCount;
      await txnManager.save(departure);

      const activeBooking = await this.bookingService.getActiveBooking(
        userId,
        departureId,
      );

      if (activeBooking) {
        throw new ConflictException('An active booking is already in progress');
      }

      const booking = await this.bookingService.create(
        {
          id,
          departureId,
          userId,
          amount: String((Number(departure.amount) * travelerCount).toFixed(2)),
          currency: departure.currency,
          status: EBookingStatus.PENDING,
          error: null,
          travelerCount,
          paymentCheckoutId: null,
          paymentReferenceId: null,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
        txnManager,
      );

      for (const travelerId of uqTravelerIds) {
        await this.bookingTravelerService.create(
          {
            bookingId: id,
            travelerId,
          },
          txnManager,
        );
      }

      return booking;
    });

    try {
      const order = await this.paymentService.createOrder({
        amount: Math.round(Number(booking.amount) * 100),
        currency: booking.currency,
        receipt: booking.id,
        notes: {
          bookingId: booking.id,
        },
      });

      await this.bookingService.updatePaymentCheckoutId(booking.id, order.id);

      // TODO: SEND BOOKING CREATED EVENT
      /*
      {
        event: booking:created
        payload: {
          bookingId: string
        }
      }
      */

      return {
        bookingId: booking.id,
        orderId: order.id,
        amount: booking.amount,
        currency: booking.currency,
      };
    } catch (err) {
      this.logger.error(`Razorpay order failed for booking ${booking.id}`, err);
      await this.recordPaymentExpired(booking.id);

      throw new ServiceUnavailableException(
        'Failed to place an order, please try again',
      );
    }
  }

  async recordPaymentExpired(bookingId: string): Promise<void> {
    await this.txn.run(async (manager) => {
      const bookingRepo = manager.getRepository(BookingEntity);
      const departureRepo = manager.getRepository(TripDepartureEntity);

      const candidate = await bookingRepo.findOne({
        where: {
          id: bookingId,
          status: EBookingStatus.PENDING,
        },
      });

      if (!candidate) return;

      const departure = await departureRepo
        .createQueryBuilder('departure')
        .setLock('pessimistic_write')
        .where('departure.id = :id', {
          id: candidate.departureId,
        })
        .getOne();

      if (!departure) {
        throw new InternalServerErrorException(
          'Departure not found for booking',
        );
      }

      const booking = await bookingRepo
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.id = :id', {
          id: candidate.id,
        })
        .andWhere('booking.id = :bookingId', {
          bookingId,
        })
        .andWhere('booking.status = :status', {
          status: EBookingStatus.PENDING,
        })
        .getOne();

      if (!booking) return;

      if (departure.bookedSeats < booking.travelerCount) {
        throw new InternalServerErrorException(
          'Departure inventory inconsistency',
        );
      }

      departure.bookedSeats -= booking.travelerCount;
      booking.status = EBookingStatus.EXPIRED;

      await bookingRepo.save(booking);
      await departureRepo.save(departure);
    });

    // TODO: SEND BOOKING EXPIRED EVENT
    /*
    {
      event: booking:expired
      payload: {
        bookingId
      }
    }
    */
  }

  async reconcileLatePayment(
    bookingId: string,
    departureId: string,
    paymentId: string,
    paymentMethod: string,
  ): Promise<void> {
    const booking = await this.txn.run(async (manager) => {
      const departure = await manager
        .getRepository(TripDepartureEntity)
        .createQueryBuilder('departure')
        .setLock('pessimistic_write')
        .where('departure.id = :departureId', { departureId })
        .getOne();

      if (!departure) return;

      const booking = await manager
        .getRepository(BookingEntity)
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.id = :bookingId', { bookingId })
        .andWhere('booking.status = :bookingStatus', {
          bookingStatus: EBookingStatus.EXPIRED,
        })
        .andWhere(
          '(booking.refundStatus IS NULL OR (booking.refundStatus = :rp AND booking.paymentRefundId IS NULL))',
          { rp: EBookingRefundStatus.PENDING },
        )
        .getOne();

      if (!booking) return;

      if (booking.refundStatus === EBookingRefundStatus.PENDING) return booking;

      booking.paymentReferenceId = paymentId;
      if (
        departure.status === ETripDepartureStatus.OPEN &&
        departure.capacity - departure.bookedSeats >= booking.travelerCount
      ) {
        departure.bookedSeats += booking.travelerCount;

        booking.status = EBookingStatus.CONFIRMED;
        booking.paymentMethod = paymentMethod;

        await manager.save(departure);
        await manager.save(booking);

        // TODO: SEND BOOKING CONFIRMED EVENT
        /*
        {
          event: booking:confirmed
          payload: {
            bookingId
          }
        }
        */

        return booking;
      }

      booking.refundStatus = EBookingRefundStatus.PENDING;
      booking.refundAmount = booking.amount;
      booking.refundReason = 'LATE PAYMENT | SEATS UNAVAILABLE';
      booking.paymentMethod = paymentMethod;
      await manager.save(booking);

      return booking;
    });

    if (booking && booking.refundAmount && booking.paymentReferenceId) {
      const refundRes = await this.paymentService.refundBooking(
        booking.id,
        booking.paymentReferenceId,
        Math.round(Number(booking.refundAmount) * 100),
      );

      await this.bookingService.setPaymentRefundId(booking.id, refundRes.id);

      // TODO: SEND BOOKING REFUND INITIATED
      /*
      {
        event: booking:refund:initiated
        payload: {
          bookingId
        }
      }
      */
    }
  }

  async recordPaymentSuccess(
    orderId: string,
    paymentId: string,
    paymentMethod: string,
  ): Promise<void> {
    const res = await this.bookingService.updateBookingConfirmed(
      orderId,
      paymentId,
      paymentMethod,
    );
    if (res.affected === 1) {
      // TODO: SEND BOOKING CONFIRMED EVENT
      /*
      {
        event: booking:confirmed
        payload: {
          bookingId
        }
      }
      */

      return;
    }

    const booking = await this.bookingService.getByPaymentCheckoutId(orderId);
    if (!booking) return;

    if (booking.status === EBookingStatus.EXPIRED) {
      return await this.reconcileLatePayment(
        booking.id,
        booking.departureId,
        paymentId,
        paymentMethod,
      );
    }
  }

  async retryPayment(
    bookingId: string,
    userId: string,
  ): Promise<CreateBookingResDto> {
    const booking = await this.txn.run(async (manager) => {
      const booking = await manager
        .getRepository(BookingEntity)
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.id = :bookingId', { bookingId })
        .andWhere('booking.userId = :userId', { userId })
        .getOne();

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.status !== EBookingStatus.PENDING) {
        throw new ConflictException(
          'Payment retry is not allowed for this booking',
        );
      }

      if (!booking.expiresAt || booking.expiresAt <= new Date()) {
        throw new ConflictException('Booking reservation has expired');
      }

      if (!booking.paymentCheckoutId) {
        throw new ConflictException('Payment order has not been created');
      }

      return booking;
    });

    const order = await this.paymentService.getOrder(
      booking.paymentCheckoutId!,
    );

    if (order.status === 'paid') {
      throw new ConflictException('Payment has already been completed');
    }

    if (!['created', 'attempted'].includes(order.status)) {
      throw new ConflictException('This payment order cannot be retried');
    }

    return {
      bookingId: booking.id,
      orderId: order.id,
      amount: booking.amount,
      currency: booking.currency,
    };
  }

  async recordRefundDetails(
    paymentId: string,
    refundId: string,
    status: EBookingRefundStatus,
  ): Promise<void> {
    await this.bookingService.setRefundDetails(paymentId, refundId, status);

    // TODO: SEND BOOKING REFUND PROCESSED/FAILED
    /*
    {
      event: booking:refund:${status}
      payload: {
        bookingId
      }
    }
    */
  }

  async notifyPaymentFailure(orderId: string): Promise<void> {
    const booking = await this.bookingService.getByPaymentCheckoutId(orderId);
    if (!booking) return;
    // TODO: SEND BOOKING PAYMENT FAILED
    /*
    {
      event: booking:payment:${status}
      payload: {
        bookingId
      }
    }
    */
  }

  async handleWebhookEvents(
    eventId: string,
    webhookBody: string,
    signature: string,
  ) {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET)
      throw new InternalServerErrorException(
        'Razorpay webhook secret is missing',
      );

    if (!this.paymentService.validateWebhook(webhookBody, signature))
      throw new UnprocessableEntityException(
        'Invalid webhook signature',
        eventId,
      );

    const eventData = JSON.parse(webhookBody);

    switch (eventData.event) {
      case 'order.paid':
        return await this.recordPaymentSuccess(
          eventData.payload.order.entity.id,
          eventData.payload.payment.entity.id,
          eventData.payload.payment.entity.method,
        );
      case 'payment.failed':
        return await this.notifyPaymentFailure(
          eventData.payload.payment.entity.order_id,
        );
      case 'refund.processed':
      case 'refund.failed':
        return await this.recordRefundDetails(
          eventData.payload.refund.entity.payment_id,
          eventData.payload.refund.entity.id,
          eventData.payload.refund.entity.status,
        );
    }
  }

  async cancelBooking(
    userId: string,
    record: CancelBookingReqDto,
  ): Promise<CancelBookingResDto> {
    const { bookingId, cancellationReason } = record;

    const candidate = await this.bookingService.getByIdOrThrow(bookingId);

    if (candidate.userId !== userId) {
      throw new ForbiddenException("Booking doesn't belong to the user");
    }

    const booking = await this.txn.run(async (manager) => {
      const departure = await manager
        .getRepository(TripDepartureEntity)
        .createQueryBuilder('departure')
        .setLock('pessimistic_write')
        .where('departure.id = :departureId', {
          departureId: candidate.departureId,
        })
        .getOne();

      if (!departure) throw new NotFoundException('Trip departure not found');

      if (new Date(departure.startDate) <= new Date())
        throw new ConflictException('Trip has already started');

      if (departure.status === ETripDepartureStatus.CANCELLED)
        throw new ConflictException('Trip cancelled, refund already processed');

      const booking = await manager
        .getRepository(BookingEntity)
        .createQueryBuilder('booking')
        .setLock('pessimistic_write')
        .where('booking.id = :bookingId', { bookingId })
        .andWhere('booking.status = :bookingStatus', {
          bookingStatus: EBookingStatus.CONFIRMED,
        })
        .andWhere('booking.refundStatus IS NULL')
        .getOne();

      if (!booking)
        throw new ConflictException('Booking is not in a refundable state.');
      if (!booking.paymentReferenceId)
        throw new ServiceUnavailableException(
          "Booking doesn't have a valid payment reference",
        );

      if (departure.bookedSeats < booking.travelerCount)
        throw new InternalServerErrorException(
          'Trip departure seats are out of sync',
        );

      departure.bookedSeats -= booking.travelerCount;
      booking.status = EBookingStatus.CANCELLED;
      booking.cancellationReason = cancellationReason || null;
      booking.cancelledAt = new Date();
      const refundAmount = calculateRefundAmount(
        booking.cancelledAt,
        new Date(departure.startDate),
        Number(booking.amount),
      );
      booking.cancellationFee = Math.round(
        Number(booking.amount) - refundAmount,
      ).toFixed(2);

      if (refundAmount > 0) {
        booking.refundStatus = EBookingRefundStatus.PENDING;
        booking.refundAmount = refundAmount.toFixed(2);
        booking.refundReason = 'CANCELLED BY USER';
      }

      await manager.save(departure);
      await manager.save(booking);

      return booking;
    });

    // TODO: SEND BOOKING CANCELLED
    /*
    {
      event: booking:cancelled
      payload: {
        bookingId
      }
    }
    */

    if (booking.refundStatus === null)
      return {
        bookingId: booking.id,
        refundId: null,
        bookingAmount: booking.amount,
        refundAmount: '0',
        cancellationFee: booking.amount,
        paymentMethod: booking.paymentMethod!,
      };

    const refundRes = await this.paymentService.refundBooking(
      booking.id,
      booking.paymentReferenceId!,
      Math.round(Number(booking.refundAmount) * 100),
    );

    await this.bookingService.setPaymentRefundId(booking.id, refundRes.id);

    return {
      bookingId: booking.id,
      refundId: refundRes.id,
      bookingAmount: booking.amount,
      refundAmount: booking.refundAmount!,
      cancellationFee: booking.cancellationFee!,
      paymentMethod: booking.paymentMethod!,
    };
  }

  async getCancellationQuote(
    userId: string,
    bookingId: string,
  ): Promise<CancelQuoteResDto> {
    const booking = await this.bookingService.getByIdOrThrow(bookingId);
    if (booking.userId !== userId)
      throw new ForbiddenException("Booking doesn't belong to the user");

    if (booking.status !== EBookingStatus.CONFIRMED)
      throw new ConflictException('Cannot cancel unconfirmed booking');

    const now = new Date();

    const departure = await this.departureService.findByIdAndStatusOrThrow(
      booking.departureId,
      ETripDepartureStatus.OPEN,
    );
    if (new Date(departure.startDate) <= now)
      throw new ConflictException('Trip has already started');

    const refundAmount = calculateRefundAmount(
      now,
      new Date(departure.startDate),
      Number(booking.amount),
    );

    return {
      bookingAmount: booking.amount,
      refundAmount: refundAmount.toFixed(2),
      cancellationFee: Math.round(
        Number(booking.amount) - refundAmount,
      ).toFixed(2),
      paymentMethod: booking.paymentMethod!,
    };
  }

  async sweepStaleBookings(): Promise<void> {
    const page = 1,
      size = 100;

    const staleBookings = await this.bookingService.getStaleBookings({
      page,
      size,
    });

    if (!staleBookings.length) return;

    const res = await Promise.allSettled(
      staleBookings.map((id) => this.recordPaymentExpired(id)),
    );

    res.forEach((r, i) => {
      if (r.status === 'rejected')
        this.logger.error(`Expire failed for ${staleBookings[i]}`, r.reason);
    });
  }

  async sweepOrphanRefunds(): Promise<void> {
    const page = 1,
      size = 100;

    const orphanRefunds = await this.bookingService.getOrphanRefunds({
      page,
      size,
    });

    if (!orphanRefunds.length) return;

    const res = await Promise.allSettled(
      orphanRefunds.map(async (booking) => {
        if (!booking.paymentReferenceId || !booking.refundAmount) return;

        const refundRes = await this.paymentService.refundBooking(
          booking.id,
          booking.paymentReferenceId,
          Math.round(Number(booking.refundAmount) * 100),
        );
        await this.bookingService.setPaymentRefundId(booking.id, refundRes.id);
      }),
    );

    res.forEach((r, i) => {
      if (r.status === 'rejected')
        this.logger.error(
          `Refund issue failed for ${orphanRefunds[i].id}`,
          r.reason,
        );
    });
  }
}
