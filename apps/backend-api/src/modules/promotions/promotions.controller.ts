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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, Public } from '../../common/decorators/roles.decorator';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all promotions' })
  @ApiResponse({ status: 200, description: 'Promotions list' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.promotionsService.findAll(page, limit);
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Get currently active promotions' })
  @ApiResponse({ status: 200, description: 'Active promotions' })
  async getActive() {
    return this.promotionsService.getActive();
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a promotion code' })
  @ApiResponse({ status: 200, description: 'Promotion validation result' })
  async validate(
    @Body() body: { code: string; order_amount: number; product_id?: string },
  ) {
    return this.promotionsService.validateAndCalculate(
      body.code,
      body.order_amount,
      body.product_id,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a promotion (admin)' })
  @ApiResponse({ status: 201, description: 'Promotion created' })
  async create(@Body() body: any) {
    return this.promotionsService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a promotion (admin)' })
  @ApiResponse({ status: 200, description: 'Promotion updated' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.promotionsService.update(id, body);
  }
}
