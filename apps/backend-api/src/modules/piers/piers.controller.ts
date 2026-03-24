import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PiersService } from './piers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Public } from '../../common/decorators/roles.decorator';

@ApiTags('piers')
@Controller('piers')
export class PiersController {
  constructor(private readonly piersService: PiersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all piers' })
  @ApiResponse({ status: 200, description: 'Piers list' })
  @ApiQuery({ name: 'province_id', required: false })
  async findAll(@Query('province_id') provinceId?: string) {
    return this.piersService.findAll(provinceId);
  }

  @Public()
  @Get('provinces')
  @ApiOperation({ summary: 'List all provinces with piers' })
  @ApiResponse({ status: 200, description: 'Provinces list' })
  async getProvinces() {
    return this.piersService.getProvinces();
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find piers near a location' })
  @ApiResponse({ status: 200, description: 'Nearby piers' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  async findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius = 50,
  ) {
    return this.piersService.findNearby(lat, lng, radius);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get pier by ID' })
  @ApiResponse({ status: 200, description: 'Pier details' })
  async findById(@Param('id') id: string) {
    return this.piersService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new pier (admin)' })
  @ApiResponse({ status: 201, description: 'Pier created' })
  async create(@Body() body: any) {
    return this.piersService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a pier (admin)' })
  @ApiResponse({ status: 200, description: 'Pier updated' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.piersService.update(id, body);
  }
}
