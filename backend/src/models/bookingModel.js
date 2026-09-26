import { query, getClient } from '../config/pool.js'

export async function createBooking({ userId, serviceId, bookingDate, bookingTime, customerNote }) {
  const result = await query(
    `
      INSERT INTO bookings (
        user_id, service_id, booking_date, booking_time, status, customer_note
      )
      VALUES ($1, $2, $3, $4, 'requested', $5)
      RETURNING id, user_id, service_id, booking_date, booking_time, status, customer_note, admin_note, created_at, updated_at
    `,
    [userId, serviceId, bookingDate, bookingTime, customerNote || null],
  )
  return result.rows[0]
}

export async function findConfirmedSlot(bookingDate, bookingTime) {
  const result = await query(
    `
      SELECT id
      FROM bookings
      WHERE booking_date = $1
        AND booking_time = $2
        AND status = 'confirmed'
      LIMIT 1
    `,
    [bookingDate, bookingTime],
  )
  return result.rows[0] || null
}

export async function findPendingDuplicate({ userId, bookingDate, bookingTime, serviceId }) {
  const result = await query(
    `
      SELECT id
      FROM bookings
      WHERE user_id = $1
        AND service_id = $2
        AND booking_date = $3
        AND booking_time = $4
        AND status = 'requested'
      LIMIT 1
    `,
    [userId, serviceId, bookingDate, bookingTime],
  )
  return result.rows[0] || null
}

export async function listUserBookings(userId) {
  const result = await query(
    `
      SELECT
        b.id, b.booking_date, b.booking_time, b.status,
        b.customer_note, b.admin_note, b.created_at, b.updated_at,
        s.name AS service_name, s.slug AS service_slug,
        s.price_paise, s.level
      FROM bookings b
      JOIN services s ON s.id = b.service_id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, b.booking_time DESC, b.created_at DESC
    `,
    [userId],
  )
  return result.rows
}

export async function listAdminBookings(status = 'all') {
  const params = []
  const where = status === 'all' ? '' : 'WHERE b.status = $1'
  if (status !== 'all') params.push(status)

  const result = await query(
    `
      SELECT
        b.id, b.booking_date, b.booking_time, b.status,
        b.customer_note, b.admin_note, b.created_at, b.updated_at,
        u.id AS user_id, u.name AS customer_name, u.email AS customer_email,
        s.name AS service_name, s.slug AS service_slug,
        s.price_paise, s.level
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      JOIN services s ON s.id = b.service_id
      ${where}
      ORDER BY
        CASE b.status
          WHEN 'requested' THEN 1
          WHEN 'confirmed' THEN 2
          WHEN 'rejected' THEN 3
          WHEN 'completed' THEN 4
          WHEN 'cancelled' THEN 5
          ELSE 6
        END,
        b.booking_date ASC, b.booking_time ASC, b.created_at ASC
    `,
    params,
  )
  return result.rows
}

export async function updateBookingStatus({ bookingId, status, adminNote }) {
  const client = await getClient()

  try {
    await client.query('BEGIN')

    const bookingResult = await client.query(
      `
        SELECT id, booking_date, booking_time, status
        FROM bookings
        WHERE id = $1
        FOR UPDATE
      `,
      [bookingId],
    )

    const booking = bookingResult.rows[0]
    if (!booking) {
      await client.query('ROLLBACK')
      return { kind: 'not_found' }
    }

    if (!['requested', 'confirmed'].includes(booking.status)) {
      await client.query('ROLLBACK')
      return { kind: 'invalid_status', currentStatus: booking.status }
    }

    if (status === 'confirmed') {
      const conflict = await client.query(
        `
          SELECT id
          FROM bookings
          WHERE booking_date = $1
            AND booking_time = $2
            AND status = 'confirmed'
            AND id <> $3
          LIMIT 1
        `,
        [booking.booking_date, booking.booking_time, booking.id],
      )

      if (conflict.rows[0]) {
        await client.query('ROLLBACK')
        return { kind: 'slot_taken' }
      }
    }

    const result = await client.query(
      `
        UPDATE bookings
        SET status = $1, admin_note = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id, booking_date, booking_time, status, customer_note, admin_note, updated_at
      `,
      [status, adminNote || null, bookingId],
    )

    await client.query('COMMIT')
    return { kind: 'updated', booking: result.rows[0] }
  } catch (error) {
    await client.query('ROLLBACK')
    if (error.code === '23505') return { kind: 'slot_taken' }
    throw error
  } finally {
    client.release()
  }
}
