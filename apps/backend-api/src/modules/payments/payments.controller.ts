import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentMethod } from './entities/payment.entity';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a payment for a booking' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  async createPayment(
    @Body() body: { booking_id: string; method: PaymentMethod },
  ) {
    return this.paymentsService.createPayment(body.booking_id, body.method);
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get payment by booking ID' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  async getByBookingId(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getByBookingId(bookingId);
  }

  @Post('qr')
  @ApiOperation({ summary: 'Process QR code payment' })
  @ApiResponse({ status: 200, description: 'QR payment processed' })
  async processQR(@Body() body: { payment_id: string }) {
    return this.paymentsService.processQR(body.payment_id);
  }

  @Post('card')
  @ApiOperation({ summary: 'Process credit/debit card payment' })
  @ApiResponse({ status: 200, description: 'Card payment processed' })
  async processCard(
    @Body() body: { payment_id: string; card_token: string; last_four: string },
  ) {
    return this.paymentsService.processCard(body.payment_id, {
      card_token: body.card_token,
      last_four: body.last_four,
    });
  }

  @Post('cod')
  @ApiOperation({ summary: 'Select cash on delivery payment' })
  @ApiResponse({ status: 200, description: 'COD payment created' })
  async processCOD(@Body() body: { payment_id: string }) {
    return this.paymentsService.processCOD(body.payment_id);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({ status: 200, description: 'Refund processed' })
  async refund(@Body() body: { payment_id: string; reason: string }) {
    return this.paymentsService.refund(body.payment_id, body.reason);
  }
}
