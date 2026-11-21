import { test, describe } from 'node:test'
import assert from 'node:assert'

// --------------------------------------------------------------------------
// BUSINESS LOGIC UNDER TEST
// --------------------------------------------------------------------------
function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) {
    return 'Distance unavailable'
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000)
    return `${meters} m`
  }
  return `${distanceKm.toFixed(1)} km`
}

function calculateDistanceTrend(currentKm, previousKm) {
  if (currentKm === null || previousKm === null) return 'unknown'
  const diff = currentKm - previousKm
  if (diff < -0.2) return 'getting_closer'
  if (diff > 0.2) return 'moving_farther'
  return 'steady'
}

function isLocationStale(isoDate) {
  if (!isoDate) return true
  const date = new Date(isoDate)
  const diffMs = Date.now() - date.getTime()
  return diffMs > 2 * 60 * 60 * 1000 // 2 hours
}

function formatTimeAgo(isoDate) {
  if (!isoDate) return 'Unknown'
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (diffMs < 0) return 'Just now'
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes === 1) return '1 minute ago'
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`
  if (diffHours === 1) return '1 hour ago'
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

// --------------------------------------------------------------------------
// TEST SUITE
// --------------------------------------------------------------------------
describe('Proximity & Distance Calculations (Haversine Formula)', () => {
  test('returns 0 for identical coordinates', () => {
    const dist = calculateHaversineDistance(40.7128, -74.006, 40.7128, -74.006)
    assert.strictEqual(dist, 0)
  })

  test('calculates accurate distance between NYC and Philadelphia (~130 km)', () => {
    // NYC (40.7128, -74.0060) to Philadelphia (39.9526, -75.1652)
    const dist = calculateHaversineDistance(40.7128, -74.006, 39.9526, -75.1652)
    assert.ok(dist >= 128 && dist <= 132, `Expected ~130km, got ${dist}`)
  })

  test('calculates short distance accurately (~11.2 km)', () => {
    // 40.7128 to 40.8128 latitude shift ~ 11.1 km
    const dist = calculateHaversineDistance(40.7128, -74.006, 40.8128, -74.006)
    assert.strictEqual(dist, 11.1)
  })
})

describe('Distance Formatting', () => {
  test('formats null as unavailable', () => {
    assert.strictEqual(formatDistance(null), 'Distance unavailable')
  })

  test('formats sub-kilometer distance in meters', () => {
    assert.strictEqual(formatDistance(0.45), '450 m')
    assert.strictEqual(formatDistance(0.08), '80 m')
  })

  test('formats kilometer distance with 1 decimal place', () => {
    assert.strictEqual(formatDistance(12.4), '12.4 km')
    assert.strictEqual(formatDistance(5.0), '5.0 km')
  })
})

describe('Proximity Trend Detection', () => {
  test('detects getting closer when current distance decreases by > 0.2km', () => {
    const trend = calculateDistanceTrend(10.0, 10.5)
    assert.strictEqual(trend, 'getting_closer')
  })

  test('detects moving farther when current distance increases by > 0.2km', () => {
    const trend = calculateDistanceTrend(12.8, 12.0)
    assert.strictEqual(trend, 'moving_farther')
  })

  test('detects steady distance for minor variations within 0.2km', () => {
    const trend = calculateDistanceTrend(12.1, 12.0)
    assert.strictEqual(trend, 'steady')
  })

  test('handles nulls gracefully', () => {
    assert.strictEqual(calculateDistanceTrend(null, 10), 'unknown')
    assert.strictEqual(calculateDistanceTrend(10, null), 'unknown')
  })
})

describe('Stale Location Detection', () => {
  test('marks recent location (15 min ago) as fresh', () => {
    const recent = new Date(Date.now() - 15 * 60000).toISOString()
    assert.strictEqual(isLocationStale(recent), false)
  })

  test('marks location older than 2 hours as stale', () => {
    const old = new Date(Date.now() - 150 * 60000).toISOString()
    assert.strictEqual(isLocationStale(old), true)
  })

  test('treats missing timestamp as stale', () => {
    assert.strictEqual(isLocationStale(null), true)
  })
})

describe('Time-ago Formatter', () => {
  test('formats less than a minute as Just now', () => {
    const justNow = new Date().toISOString()
    assert.strictEqual(formatTimeAgo(justNow), 'Just now')
  })

  test('formats minutes correctly', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString()
    assert.strictEqual(formatTimeAgo(fiveMinAgo), '5 minutes ago')
  })

  test('formats hours correctly', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString()
    assert.strictEqual(formatTimeAgo(twoHoursAgo), '2 hours ago')
  })
})
