# BOATLY - Database

## Schema Files

| File | Purpose |
|------|---------|
| `schema/postgres-production.sql` | **PostgreSQL 14+** - Production-ready schema (30 tables) |
| `schema/complete-schema.sql` | Legacy PostgreSQL schema (providers/products model) |

## Quick Start (PostgreSQL)

```bash
# Create database
createdb boatly

# Apply schema
psql -d boatly -f schema/postgres-production.sql
```

## Migration from MySQL (Current XAMPP)

The current system uses **MySQL** via `setup.php`. To migrate to PostgreSQL:

1. Export MySQL data (CSV or custom script)
2. Apply `postgres-production.sql` to create tables
3. Map column names (e.g. `favorites` → `user_favorites`, `boat_id` in both)
4. Transform data (INT id → UUID, DATETIME → TIMESTAMPTZ)
5. Import with `COPY` or `INSERT`

## Table Count: 30

- **Core**: users, user_auth, destinations, piers, operators, operator_users
- **Boats**: boats, boat_images, boat_routes, route_stops, addons, boat_availability
- **Bookings**: bookings, booking_passengers, booking_requests, booking_checkins
- **Payments**: payments, payment_transactions
- **Reviews**: reviews, review_images
- **User**: user_favorites, notifications
- **Marketing**: promotions, promo_usage
- **Tracking**: boat_locations, tips
- **System**: settings, audit_log, device_tokens, api_keys

## Multilingual Support

Tables with `_th`, `_en`, `_zh`, `_ko`, `_fr` columns:
- destinations
- boats
- addons
- promotions
