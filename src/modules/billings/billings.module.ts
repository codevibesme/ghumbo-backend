import { Module } from '@nestjs/common';
import { BookingModule } from '../bookings/bookings.module.js';
import { UserModule } from '../users/users.module.js';
import { TripDepartureModule } from '../trip_departures/trip_departures.module.js';
import { TxnHelperModule } from '../../helpers/txn.module.js';
import { BookingTravelerModule } from '../booking_travelers/booking_travelers.module.js';
import { TravelerModule } from '../travelers/travelers.module.js';
import { PaymentModule } from '../../lib/payment/payment.module.js';
import { BillingService } from './billings.service.js';
import { BillingController } from './billings.controller.js';

@Module({
  imports: [
    TxnHelperModule,
    PaymentModule,
    UserModule,
    TripDepartureModule,
    TravelerModule,
    BookingModule,
    TripDepartureModule,
    BookingTravelerModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
