import crypto from 'crypto'

const baseUrl = 'https://api.razorpay.com/v1'

function credentials() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim()
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim()
  if (!keyId || !keySecret) throw new Error('Razorpay is not configured on the server.')
  return { keyId, keySecret }
}

async function razorpayRequest(path, options = {}) {
  const { keyId, keySecret } = credentials()
  const response = await fetch(baseUrl + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(keyId + ':' + keySecret).toString('base64'),
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.error?.description || 'Razorpay request failed.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return data
}

export function getRazorpayKeyId() {
  return credentials().keyId
}

export async function createRazorpayOrder({ amountPaise, receipt }) {
  return razorpayRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      payment_capture: 1,
    }),
  })
}

export async function fetchRazorpayPayment(paymentId) {
  return razorpayRequest('/payments/' + encodeURIComponent(paymentId))
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const { keySecret } = credentials()
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(orderId + '|' + paymentId)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expected, 'utf8'),
    Buffer.from(String(signature || ''), 'utf8'),
  )
}
