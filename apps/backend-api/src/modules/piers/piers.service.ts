import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pier } from './entities/pier.entity';
import { Province } from './entities/province.entity';

@Injectable()
export class PiersService {
  private readonly logger = new Logger(PiersService.name);

  constructor(
    @InjectRepository(Pier)
    private pierRepository: Repository<Pier>,
    @InjectRepository(Province)
    private provinceRepository: Repository<Province>,
  ) {}

  async findAll(provinceId?: string) {
    const where: any = { is_active: true };
    if (provinceId) {
      where.province_id = provinceId;
    }

    return this.pierRepository.find({
      where,
      relations: ['province'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Pier> {
    const pier = await this.pierRepository.findOne({
      where: { id },
      relations: ['province'],
    });
    if (!pier) {
      throw new NotFoundException(`Pier with ID ${id} not found`);
    }
    return pier;
  }

  async findNearby(latitude: number, longitude: number, radiusKm = 50) {
    const piers = await this.pierRepository
      .createQueryBuilder('pier')
      .leftJoinAndSelect('pier.province', 'province')
      .where('pier.is_active = :active', { active: true })
      .addSelect(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(pier.latitude)) * cos(radians(pier.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(pier.latitude))))`,
        'distance',
      )
      .having('distance <= :radius', { radius: radiusKm })
      .setParameters({ lat: latitude, lng: longitude })
      .orderBy('distance', 'ASC')
      .getRawAndEntities();

    return piers.entities.map((pier, index) => ({
      ...pier,
      distance_km: parseFloat(piers.raw[index]?.distance || '0'),
    }));
  }

  async getProvinces() {
    return this.provinceRepository.find({
      relations: ['piers'],
      order: { name: 'ASC' },
    });
  }

  async create(data: Partial<Pier>): Promise<Pier> {
    const pier = this.pierRepository.create(data);
    return this.pierRepository.save(pier);
  }

  async update(id: string, data: Partial<Pier>): Promise<Pier> {
    const pier = await this.findById(id);
    Object.assign(pier, data);
    return this.pierRepository.save(pier);
  }
}
