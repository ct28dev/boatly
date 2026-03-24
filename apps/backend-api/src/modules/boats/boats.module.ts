import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoatsController } from './boats.controller';
import { BoatsService } from './boats.service';
import { Boat } from './entities/boat.entity';
import { BoatCrew } from './entities/boat-crew.entity';
import { BoatLocation } from './entities/boat-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Boat, BoatCrew, BoatLocation])],
  controllers: [BoatsController],
  providers: [BoatsService],
  exports: [BoatsService],
})
export class BoatsModule {}
