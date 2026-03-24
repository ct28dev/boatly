import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../users/entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(data: {
    user_id: string;
    title: string;
    body: string;
    type: NotificationType;
    metadata?: Record<string, any>;
  }) {
    const notification = this.notificationRepository.create(data);
    const saved = await this.notificationRepository.save(notification);

    this.sendPush(data.user_id, data.title, data.body).catch((err) => {
      this.logger.warn(`Failed to send push notification: ${err.message}`);
    });

    return saved;
  }

  async getUserNotifications(userId: string, page = 1, limit = 30) {
    const [items, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { user_id: userId, is_read: false },
    });

    return {
      items,
      total,
      unread_count: unreadCount,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
    return { message: 'All notifications marked as read' };
  }

  async sendPush(userId: string, title: string, body: string) {
    this.logger.log(`Push notification sent to user ${userId}: ${title}`);
    return { sent: true, user_id: userId };
  }

  async deleteOldNotifications(daysOld = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoff', { cutoff })
      .andWhere('is_read = :read', { read: true })
      .execute();

    return { deleted: result.affected };
  }

  async sendBookingConfirmation(userId: string, bookingNumber: string) {
    return this.create({
      user_id: userId,
      title: 'Booking Confirmed',
      body: `Your booking ${bookingNumber} has been confirmed. Have a great trip!`,
      type: NotificationType.BOOKING_CONFIRMED,
      metadata: { booking_number: bookingNumber },
    });
  }

  async sendPaymentSuccess(userId: string, bookingNumber: string, amount: number) {
    return this.create({
      user_id: userId,
      title: 'Payment Successful',
      body: `Payment of ${amount} THB for booking ${bookingNumber} was successful.`,
      type: NotificationType.PAYMENT_SUCCESS,
      metadata: { booking_number: bookingNumber, amount },
    });
  }

  async sendCheckinReminder(userId: string, bookingNumber: string, departureTime: string) {
    return this.create({
      user_id: userId,
      title: 'Check-in Reminder',
      body: `Don't forget! Your trip (${bookingNumber}) departs at ${departureTime}. Please arrive at the pier 30 minutes early.`,
      type: NotificationType.CHECKIN_REMINDER,
      metadata: { booking_number: bookingNumber, departure_time: departureTime },
    });
  }
}
