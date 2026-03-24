import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { PaymentTransaction, TransactionType } from './entities/payment-transaction.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async createPayment(bookingId: string, method: PaymentMethod) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const existing = await this.paymentRepository.findOne({
      where: { booking_id: bookingId },
    });
    if (existing && existing.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed for this booking');
    }

    if (existing) {
      existing.method = method;
      existing.status = PaymentStatus.PENDING;
      return this.paymentRepository.save(existing);
    }

    const payment = this.paymentRepository.create({
      booking_id: bookingId,
      amount: booking.final_price,
      currency: 'THB',
      method,
      status: PaymentStatus.PENDING,
      transaction_ref: `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
      expires_at: new Date(Date.now() + 30 * 60 * 1000),
    });

    return this.paymentRepository.save(payment);
  }

  async processQR(paymentId: string) {
    const payment = await this.findPaymentById(paymentId);

    payment.status = PaymentStatus.PROCESSING;
    payment.qr_code_url = `https://payment.boatly.com/qr/${payment.transaction_ref}`;
    await this.paymentRepository.save(payment);

    const transaction = this.transactionRepository.create({
      payment_id: payment.id,
      type: TransactionType.CHARGE,
      amount: payment.amount,
      status: 'pending',
      reference: `QR-${uuidv4().slice(0, 8)}`,
    });
    await this.transactionRepository.save(transaction);

    // Simulate QR payment success after creation
    payment.status = PaymentStatus.COMPLETED;
    payment.paid_at = new Date();
    payment.gateway_response = { method: 'qr_code', status: 'success' };
    await this.paymentRepository.save(payment);

    transaction.status = 'completed';
    await this.transactionRepository.save(transaction);

    await this.bookingRepository.update(payment.booking_id, {
      status: BookingStatus.PAID,
    });

    return {
      payment,
      qr_code_url: payment.qr_code_url,
      transaction_ref: payment.transaction_ref,
    };
  }

  async processCard(paymentId: string, cardData: { card_token: string; last_four: string }) {
    const payment = await this.findPaymentById(paymentId);

    payment.status = PaymentStatus.PROCESSING;
    await this.paymentRepository.save(payment);

    const transaction = this.transactionRepository.create({
      payment_id: payment.id,
      type: TransactionType.CHARGE,
      amount: payment.amount,
      status: 'processing',
      reference: `CARD-${uuidv4().slice(0, 8)}`,
      raw_response: { card_last_four: cardData.last_four },
    });
    await this.transactionRepository.save(transaction);

    // Simulate card payment processing
    payment.status = PaymentStatus.COMPLETED;
    payment.paid_at = new Date();
    payment.gateway_ref = `GW-${uuidv4().slice(0, 12)}`;
    payment.gateway_response = {
      method: 'credit_card',
      card_last_four: cardData.last_four,
      status: 'success',
    };
    await this.paymentRepository.save(payment);

    transaction.status = 'completed';
    await this.transactionRepository.save(transaction);

    await this.bookingRepository.update(payment.booking_id, {
      status: BookingStatus.PAID,
    });

    return { payment, transaction_ref: payment.transaction_ref };
  }

  async processCOD(paymentId: string) {
    const payment = await this.findPaymentById(paymentId);

    payment.method = PaymentMethod.COD;
    payment.status = PaymentStatus.PENDING;
    payment.gateway_response = { method: 'cod', note: 'Pay at pier on departure day' };
    await this.paymentRepository.save(payment);

    const transaction = this.transactionRepository.create({
      payment_id: payment.id,
      type: TransactionType.CHARGE,
      amount: payment.amount,
      status: 'pending_cod',
      reference: `COD-${uuidv4().slice(0, 8)}`,
    });
    await this.transactionRepository.save(transaction);

    await this.bookingRepository.update(payment.booking_id, {
      status: BookingStatus.CONFIRMED,
    });

    return {
      payment,
      message: 'Cash on delivery selected. Please pay at the pier on departure day.',
    };
  }

  async getByBookingId(bookingId: string) {
    const payment = await this.paymentRepository.findOne({
      where: { booking_id: bookingId },
      relations: ['transactions', 'booking'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for this booking');
    }

    return payment;
  }

  async refund(paymentId: string, reason: string) {
    const payment = await this.findPaymentById(paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Can only refund completed payments');
    }

    payment.status = PaymentStatus.REFUNDED;
    await this.paymentRepository.save(payment);

    const transaction = this.transactionRepository.create({
      payment_id: payment.id,
      type: TransactionType.REFUND,
      amount: payment.amount,
      status: 'completed',
      reference: `REFUND-${uuidv4().slice(0, 8)}`,
      raw_response: { reason },
    });
    await this.transactionRepository.save(transaction);

    await this.bookingRepository.update(payment.booking_id, {
      status: BookingStatus.REFUNDED,
    });

    return { payment, message: 'Refund processed successfully' };
  }

  private async findPaymentById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }
}
