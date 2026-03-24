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
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List all providers (admin)' })
  @ApiResponse({ status: 200, description: 'Providers list' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.providersService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider details' })
  async findById(@Param('id') id: string) {
    return this.providersService.findById(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new provider' })
  @ApiResponse({ status: 201, description: 'Provider created' })
  async create(@Body() body: Partial<any>) {
    return this.providersService.create(body);
  }

  @Put(':id')
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Update a provider' })
  @ApiResponse({ status: 200, description: 'Provider updated' })
  async update(@Param('id') id: string, @Body() body: Partial<any>) {
    return this.providersService.update(id, body);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate a provider' })
  @ApiResponse({ status: 200, description: 'Provider deactivated' })
  async delete(@Param('id') id: string) {
    return this.providersService.delete(id);
  }

  @Get(':id/tours')
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Get provider tours' })
  @ApiResponse({ status: 200, description: 'Provider tours list' })
  async getProviderTours(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.providersService.getProviderTours(id, page, limit);
  }

  @Get(':id/bookings')
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Get provider bookings' })
  @ApiResponse({ status: 200, description: 'Provider bookings list' })
  async getProviderBookings(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.providersService.getProviderBookings(id, page, limit);
  }

  @Get(':id/boats')
  @Roles('provider', 'admin')
  @ApiOperation({ summary: 'Get provider boats' })
  @ApiResponse({ status: 200, description: 'Provider boats list' })
  async getProviderBoats(@Param('id') id: string) {
    return this.providersService.getProviderBoats(id);
  }
}
