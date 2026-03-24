import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // ── Users & Authentication ──────────────────────────────────

  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('name', 255).notNullable();
    t.string('email', 255).unique().notNullable();
    t.string('phone', 20);
    t.string('language', 5).notNullable().defaultTo('th');
    t.text('profile_image');
    t.string('role', 20).notNullable().defaultTo('customer');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('email');
    t.index('role');
    t.index('phone');
  });

  await knex.schema.createTable('user_auth', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('provider', 50).notNullable();
    t.string('provider_user_id', 255).notNullable();
    t.text('password_hash');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('user_id');
    t.index(['provider', 'provider_user_id']);
  });

  // ── Providers & Boats ───────────────────────────────────────

  await knex.schema.createTable('providers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    t.string('company_name', 255).notNullable();
    t.string('tax_id', 50);
    t.string('bank_account', 50);
    t.string('contact_phone', 20);
    t.string('status', 20).notNullable().defaultTo('pending');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('user_id');
    t.index('status');
  });

  await knex.schema.createTable('boats', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('provider_id').notNullable().references('id').inTable('providers').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.string('boat_type', 50).notNullable();
    t.integer('capacity').notNullable();
    t.text('description');
    t.text('image_url');
    t.string('status', 20).notNullable().defaultTo('available');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('provider_id');
    t.index('status');
    t.index('boat_type');
  });

  await knex.schema.createTable('boat_crew', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('boat_id').notNullable().references('id').inTable('boats').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.string('role', 50).notNullable();
    t.string('phone', 20);

    t.index('boat_id');
  });

  // ── Locations & Piers ───────────────────────────────────────

  await knex.schema.createTable('provinces', (t) => {
    t.increments('id').primary();
    t.string('name_th', 100).notNullable();
    t.string('name_en', 100).notNullable();
  });

  await knex.schema.createTable('piers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.integer('province_id').unsigned().notNullable().references('id').inTable('provinces').onDelete('RESTRICT');
    t.string('name_th', 255).notNullable();
    t.string('name_en', 255).notNullable();
    t.decimal('latitude', 10, 8);
    t.decimal('longitude', 11, 8);
    t.text('address');
    t.text('image_url');

    t.index('province_id');
  });

  // ── Products / Tours ────────────────────────────────────────

  await knex.schema.createTable('products', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('provider_id').notNullable().references('id').inTable('providers').onDelete('CASCADE');
    t.string('name_th', 255).notNullable();
    t.string('name_en', 255).notNullable();
    t.text('description_th');
    t.text('description_en');
    t.integer('duration').notNullable();
    t.decimal('price', 10, 2).notNullable();
    t.integer('max_passengers').notNullable();
    t.uuid('departure_pier_id').references('id').inTable('piers').onDelete('SET NULL');
    t.uuid('return_pier_id').references('id').inTable('piers').onDelete('SET NULL');
    t.string('status', 20).notNullable().defaultTo('active');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('provider_id');
    t.index('status');
    t.index('departure_pier_id');
    t.index('return_pier_id');
    t.index('price');
  });

  await knex.schema.createTable('product_images', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.text('image_url').notNullable();
    t.integer('sort_order').notNullable().defaultTo(0);
    t.boolean('is_primary').notNullable().defaultTo(false);

    t.index('product_id');
  });

  await knex.schema.createTable('product_piers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.uuid('pier_id').notNullable().references('id').inTable('piers').onDelete('CASCADE');
    t.integer('stop_order').notNullable();

    t.index('product_id');
  });

  await knex.schema.createTable('product_schedules', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.integer('day_of_week').notNullable();
    t.string('time_slot', 20).notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);

    t.index('product_id');
    t.index('day_of_week');
  });

  await knex.raw(`
    ALTER TABLE product_schedules
    ADD CONSTRAINT chk_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6)
  `);

  // ── Bookings ────────────────────────────────────────────────

  await knex.schema.createTable('bookings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT');
    t.date('booking_date').notNullable();
    t.string('time_slot', 20).notNullable();
    t.decimal('total_amount', 10, 2).notNullable();
    t.string('status', 20).notNullable().defaultTo('pending');
    t.text('special_requests');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('user_id');
    t.index('product_id');
    t.index('status');
    t.index('booking_date');
    t.index('created_at');
  });

  await knex.schema.createTable('booking_passengers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.string('passenger_type', 20).notNullable();
    t.integer('count').notNullable();
    t.decimal('unit_price', 10, 2).notNullable();

    t.index('booking_id');
  });

  await knex.schema.createTable('booking_requests', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.text('request_text').notNullable();

    t.index('booking_id');
  });

  await knex.schema.createTable('booking_checkins', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.uuid('pier_id').notNullable().references('id').inTable('piers').onDelete('RESTRICT');
    t.timestamp('checkin_time', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.string('qr_code', 255);

    t.index('booking_id');
    t.index('qr_code');
  });

  // ── Payments ────────────────────────────────────────────────

  await knex.schema.createTable('payments', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.string('payment_method', 20).notNullable();
    t.decimal('amount', 10, 2).notNullable();
    t.string('status', 20).notNullable().defaultTo('pending');
    t.string('transaction_ref', 255);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('booking_id');
    t.index('status');
    t.index('transaction_ref');
  });

  await knex.schema.createTable('payment_transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('payment_id').notNullable().references('id').inTable('payments').onDelete('CASCADE');
    t.decimal('amount', 10, 2).notNullable();
    t.string('gateway_ref', 255);
    t.timestamp('paid_at', { useTz: true });

    t.index('payment_id');
  });

  // ── Reviews ─────────────────────────────────────────────────

  await knex.schema.createTable('reviews', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.integer('rating').notNullable();
    t.text('comment');
    t.string('status', 20).notNullable().defaultTo('pending');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('product_id');
    t.index('user_id');
    t.index('booking_id');
    t.index('status');
    t.index('rating');
  });

  await knex.raw(`
    ALTER TABLE reviews
    ADD CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
  `);

  await knex.schema.createTable('review_images', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('review_id').notNullable().references('id').inTable('reviews').onDelete('CASCADE');
    t.text('image_url').notNullable();

    t.index('review_id');
  });

  // ── Promotions ──────────────────────────────────────────────

  await knex.schema.createTable('promotions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.string('title_th', 255).notNullable();
    t.string('title_en', 255).notNullable();
    t.text('description');
    t.text('banner_image');
    t.string('discount_type', 20).notNullable();
    t.decimal('discount_value', 10, 2).notNullable();
    t.string('code', 50).unique();
    t.date('start_date').notNullable();
    t.date('end_date').notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('code');
    t.index(['is_active', 'start_date', 'end_date']);
  });

  // ── Boat Tracking ───────────────────────────────────────────

  await knex.schema.createTable('boat_locations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('boat_id').notNullable().references('id').inTable('boats').onDelete('CASCADE');
    t.decimal('latitude', 10, 8).notNullable();
    t.decimal('longitude', 11, 8).notNullable();
    t.decimal('speed', 6, 2);
    t.decimal('heading', 5, 2);
    t.timestamp('recorded_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('boat_id');
    t.index('recorded_at');
    t.index(['boat_id', 'recorded_at']);
  });

  // ── Tips ────────────────────────────────────────────────────

  await knex.schema.createTable('tips', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('crew_id').notNullable().references('id').inTable('boat_crew').onDelete('CASCADE');
    t.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.decimal('amount', 10, 2).notNullable();
    t.text('message');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('crew_id');
    t.index('booking_id');
    t.index('user_id');
  });

  // ── Notifications ───────────────────────────────────────────

  await knex.schema.createTable('notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('title', 255).notNullable();
    t.text('body').notNullable();
    t.string('type', 50).notNullable();
    t.jsonb('data');
    t.boolean('is_read').notNullable().defaultTo(false);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('user_id');
    t.index('type');
    t.index('created_at');
  });

  await knex.raw(`
    CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false
  `);

  // ── Favorites ───────────────────────────────────────────────

  await knex.schema.createTable('favorites', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.unique(['user_id', 'product_id']);
    t.index('user_id');
    t.index('product_id');
  });

  // ── Chat ────────────────────────────────────────────────────

  await knex.schema.createTable('chat_messages', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    t.uuid('booking_id').notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.uuid('sender_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.text('message').notNullable();
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    t.index('booking_id');
    t.index('sender_id');
    t.index(['booking_id', 'created_at']);
  });

  // ── Updated-at triggers ─────────────────────────────────────

  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql'
  `);

  const tablesWithUpdatedAt = ['users', 'providers', 'products', 'bookings', 'payments'];
  for (const table of tablesWithUpdatedAt) {
    await knex.raw(`
      CREATE TRIGGER update_${table}_updated_at
      BEFORE UPDATE ON ${table}
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    'chat_messages',
    'favorites',
    'notifications',
    'tips',
    'boat_locations',
    'promotions',
    'review_images',
    'reviews',
    'payment_transactions',
    'payments',
    'booking_checkins',
    'booking_requests',
    'booking_passengers',
    'bookings',
    'product_schedules',
    'product_piers',
    'product_images',
    'products',
    'piers',
    'provinces',
    'boat_crew',
    'boats',
    'providers',
    'user_auth',
    'users',
  ];

  for (const table of tables) {
    await knex.schema.dropTableIfExists(table);
  }

  await knex.raw('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
}
