import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  @ApiResponse({ status: 201, description: 'Review created' })
  async create(
    @CurrentUser() user: any,
    @Body() body: { product_id: string; booking_id?: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.create(user.id, body);
  }

  @Public()
  @Get('tour/:id')
  @ApiOperation({ summary: 'Get reviews for a tour' })
  @ApiResponse({ status: 200, description: 'Tour reviews' })
  async getByProduct(
    @Param('id') id: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.reviewsService.getByProduct(id, page, limit);
  }

  @Post('upload-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload images for a review' })
  @ApiResponse({ status: 201, description: 'Images uploaded' })
  async uploadImages(
    @Body() body: { review_id: string; image_urls: string[] },
  ) {
    return this.reviewsService.uploadImages(body.review_id, body.image_urls);
  }

  @Post(':id/respond')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provider responds to a review' })
  @ApiResponse({ status: 200, description: 'Response added' })
  async respond(
    @Param('id') id: string,
    @Body() body: { response: string },
  ) {
    return this.reviewsService.respondToReview(id, body.response);
  }
}
