import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Boat } from './entities/boat.entity';
import { BoatCrew } from './entities/boat-crew.entity';
import { BoatLocation } from './entities/boat-location.entity';

@Injectable()
export class BoatsService {
  private readonly logger = new Logger(BoatsService.name);

  constructor(
    @InjectRepository(Boat)
    private boatRepository: Repository<Boat>,
    @InjectRepository(BoatCrew)
    private crewRepository: Repository<BoatCrew>,
    @InjectRepository(BoatLocation)
    private locationRepository: Repository<BoatLocation>,
  ) {}

  async findAll(page = 1, limit = 20, providerId?: string) {
    const where: any = {};
    if (providerId) {
      where.provider_id = providerId;
    }

    const [boats, total] = await this.boatRepository.findAndCount({
      where,
      relations: ['provider', 'crew', 'location'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: boats,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Boat> {
    const boat = await this.boatRepository.findOne({
      where: { id },
      relations: ['provider', 'crew', 'location', 'products'],
    });
    if (!boat) {
      throw new NotFoundException(`Boat with ID ${id} not found`);
    }
    return boat;
  }

  async create(data: Partial<Boat>): Promise<Boat> {
    const boat = this.boatRepository.create(data);
    return this.boatRepository.save(boat);
  }

  async update(id: string, data: Partial<Boat>): Promise<Boat> {
    const boat = await this.findById(id);
    Object.assign(boat, data);
    return this.boatRepository.save(boat);
  }

  async delete(id: string) {
    const boat = await this.findById(id);
    await this.boatRepository.remove(boat);
    return { message: 'Boat deleted successfully' };
  }

  async getLocation(boatId: string): Promise<BoatLocation> {
    const location = await this.locationRepository.findOne({
      where: { boat_id: boatId },
    });
    if (!location) {
      throw new NotFoundException(`No location data for boat ${boatId}`);
    }
    return location;
  }

  async updateLocation(boatId: string, data: { latitude: number; longitude: number; heading?: number; speed_knots?: number; status?: string }) {
    let location = await this.locationRepository.findOne({
      where: { boat_id: boatId },
    });

    if (location) {
      Object.assign(location, data);
    } else {
      location = this.locationRepository.create({
        boat_id: boatId,
        ...data,
      });
    }

    return this.locationRepository.save(location);
  }

  async addCrew(boatId: string, data: Partial<BoatCrew>): Promise<BoatCrew> {
    await this.findById(boatId);
    const crew = this.crewRepository.create({ ...data, boat_id: boatId });
    return this.crewRepository.save(crew);
  }

  async removeCrew(crewId: string) {
    const crew = await this.crewRepository.findOne({ where: { id: crewId } });
    if (!crew) {
      throw new NotFoundException('Crew member not found');
    }
    await this.crewRepository.remove(crew);
    return { message: 'Crew member removed' };
  }
}
