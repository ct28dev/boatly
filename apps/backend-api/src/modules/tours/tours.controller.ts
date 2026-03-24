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
import { ToursService } from './tours.service';
import { TourQueryDto } from './dto/tour-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Public } from '../../common/decorators/roles.decorator';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List tours with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Tours list' })
  async findAll(@Query() query: TourQueryDto) {
    return this.toursService.findAll(query);
  }

  @Public()
  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended tours' })
  @ApiResponse({ status: 200, description: 'Recommended tours' })
  async getRecommended(@Query('limit') limit = 10) {
    return this.toursService.getRecommended(limit);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Find tours near a location' })
  @ApiResponse({ status: 200, description: 'Nearby tours' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius = 50,
    @Query('limit') limit = 20,
  ) {
    return this.toursService.findNearby(lat, lng, radius, limit);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search tours by keyword' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async search(
    @Query('q') keyword: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.toursService.search(keyword, page, limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get tour details' })
  @ApiResponse({ status: 200, description: 'Tour details' })
  async findById(@Param('id') id: string) {
    return this.toursService.findById(id);
  }

  @Public()
  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get tour reviews' })
  @ApiResponse({ status: 200, description: 'Tour reviews' })
  async getReviews(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.toursService.getReviews(id, page, limit);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tour' })
  @ApiResponse({ status: 201, description: 'Tour created' })
  async create(@Body() body: any) {
    return this.toursService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('provider', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tour' })
  @ApiResponse({ status: 200, description: 'Tour updated' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.toursService.update(id, body);
  }
}
