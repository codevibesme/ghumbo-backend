import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TripDepartureEntity } from "../../entities/trip_departures.entity.js";
import { TripDepartureController } from "./trip_departures.controller.js";
import { TripDepartureService } from "./trip_departures.service.js";
import { TripDepartureRepository } from "./trip_departures.repository.js";

@Module({
    imports: [TypeOrmModule.forFeature([TripDepartureEntity])],
    controllers: [TripDepartureController],
    providers: [TripDepartureService, TripDepartureRepository],
    exports: [TripDepartureService]
})
export class TripDepartureModule {}