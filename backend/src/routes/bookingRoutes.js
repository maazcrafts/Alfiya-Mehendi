import { Router } from 'express'
import {
  createBooking,
  findConfirmedSlot,
  findPendingDuplicate,
  listAdminBookings,
  listUserBookings,
  updateBookingStatus,
} from '../models/bookingModel.js'
import { findServiceBySlug } from '../models/serviceModel.js'
import { requireAdmin, requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

const TIME_PATTERN = /^(?:10|11|12|13|14|15|16|17|18|19|20):(00|30)$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidDate(date) {
  if (!DATE_PATTERN.test(date)) return false
  const parsed = new Date(`${date}T00:00:00`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

function isPastDateTime(date, time) {
  const requested = new Date(`${date}T${time}:00`)
  return requested.getTime() <= Date.now()
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { serviceSlug, bookingDate, bookingTime, customerNote } = req.body

    if (!serviceSlug || !bookingDate || !bookingTime) {
      return res.status(400).json({ message: 'Service, date and time are required.' })
    }

    if (!isValidDate(bookingDate)) {
      return res.status(400).json({ message: 'Please choose a valid date.' })
    }

    if (!TIME_PATTERN.test(bookingTime)) {
      return res.status(400).json({ message: 'Please choose a valid 30-minute time slot between 10:00 AM and 8:00 PM.' })
    }

    if (isPastDateTime(bookingDate, bookingTime)) {
      return res.status(400).json({ message: 'Please choose a future date and time.' })
    }

    const service = await findServiceBySlug(serviceSlug)
    if (!service) {
      return res.status(404).json({ message: 'The selected service is no longer available.' })
    }

    const confirmedSlot = await findConfirmedSlot(bookingDate, bookingTime)
    if (confirmedSlot) {
      return res.status(409).json({ message: 'That time slot has already been booked. Please choose another slot.' })
    }

    const duplicate = await findPendingDuplicate({
      userId: req.auth.userId || req.auth.sub,
      serviceId: service.id,
      bookingDate,
      bookingTime,
    })
    if (duplicate) {
      return res.status(409).json({ message: 'You already have a pending request for this service and time.' })
    }

    const booking = await createBooking({
      userId: req.auth.userId || req.auth.sub,
      serviceId: service.id,
      bookingDate,
      bookingTime,
      customerNote: customerNote?.trim(),
    })

    return res.status(201).json({
      message: 'Booking request sent to the admin.',
      booking,
    })
  } catch (error) {
    console.error('Create booking error:', error)
    return res.status(500).json({ message: 'Unable to send your booking request right now.' })
  }
})

router.get('/mine', requireAuth, async (req, res) => {
  try {
    const bookings = await listUserBookings(req.auth.userId || req.auth.sub)
    return res.json({ bookings })
  } catch (error) {
    console.error('Load user bookings error:', error)
    return res.status(500).json({ message: 'Unable to load your bookings.' })
  }
})

router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const allowed = ['all', 'requested', 'confirmed', 'rejected', 'completed', 'cancelled']
    const status = allowed.includes(req.query.status) ? req.query.status : 'all'
    const bookings = await listAdminBookings(status)
    return res.json({ bookings })
  } catch (error) {
    console.error('Load admin bookings error:', error)
    return res.status(500).json({ message: 'Unable to load booking requests.' })
  }
})

router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body

    if (!['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Admin status must be confirmed or rejected.' })
    }

    const result = await updateBookingStatus({
      bookingId: req.params.id,
      status,
      adminNote: adminNote?.trim(),
    })

    if (result.kind === 'not_found') {
      return res.status(404).json({ message: 'Booking request not found.' })
    }

    if (result.kind === 'invalid_status') {
      return res.status(409).json({ message: `This booking is already ${result.currentStatus}.` })
    }

    if (result.kind === 'slot_taken') {
      return res.status(409).json({ message: 'That time slot has already been confirmed for another booking.' })
    }

    return res.json({
      message: status === 'confirmed'
        ? 'Booking confirmed successfully.'
        : 'Booking request rejected.',
      booking: result.booking,
    })
  } catch (error) {
    console.error('Update booking status error:', error)
    return res.status(500).json({ message: 'Unable to update the booking right now.' })
  }
})

export default router
