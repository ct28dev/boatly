import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BoatsService } from './boats.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('boats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boats')
export class BoatsController {
  constructor(private readonly boatsService: BoatsService) {}

  @Get()
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'List all boats' })
  @ApiResponse({ status: 200, description: 'Boats list' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('provider_id') providerId?: string,
  ) {
    return this.boatsService.findAll(page, limit, providerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get boat by ID' })
  @ApiResponse({ status: 200, description: 'Boat details' })
  async findById(@Param('id') id: string) {
    return this.boatsService.findById(id);
  }

  @Post()
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Create a new boat' })
  @ApiResponse({ status: 201, description: 'Boat created' })
  async create(@Body() body: any) {
    return this.boatsService.create(body);
  }

  @Put(':id')
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Update a boat' })
  @ApiResponse({ status: 200, description: 'Boat updated' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.boatsService.update(id, body);
  }

  @Delete(':id')
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Delete a boat' })
  @ApiResponse({ status: 200, description: 'Boat deleted' })
  async delete(@Param('id') id: string) {
    return this.boatsService.delete(id);
  }

  @Get('location/:boatId')
  @ApiOperation({ summary: 'Get boat current location' })
  @ApiResponse({ status: 200, description: 'Boat location data' })
  async getLocation(@Param('boatId') boatId: string) {
    return this.boatsService.getLocation(boatId);
  }

  @Post('location/update')
  @Roles('provider')
  @ApiOperation({ summary: 'Update boat location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  async updateLocation(
    @Body() body: { boat_id: string; latitude: number; longitude: number; heading?: number; speed_knots?: number; status?: string },
  ) {
    return this.boatsService.updateLocation(body.boat_id, body);
  }

  @Post(':id/crew')
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Add crew member to boat' })
  @ApiResponse({ status: 201, description: 'Crew member added' })
  async addCrew(@Param('id') id: string, @Body() body: any) {
    return this.boatsService.addCrew(id, body);
  }

  @Delete('crew/:crewId')
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Remove crew member' })
  @ApiResponse({ status: 200, description: 'Crew member removed' })
  async removeCrew(@Param('crewId') crewId: string) {
    return this.boatsService.removeCrew(crewId);
  }
}
