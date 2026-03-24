import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PiersController } from './piers.controller';
import { PiersService } from './piers.service';
import { Pier } from './entities/pier.entity';
import { Province } from './entities/province.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pier, Province])],
  controllers: [PiersController],
  providers: [PiersService],
  exports: [PiersService],
})
export class PiersModule {}
