/**
 * Haversine formula to compute great-circle distance between two GPS coordinates
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Round to 1 decimal place
  return Math.round(distance * 10) / 10
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Formats distance nicely: meters if < 1km, else kilometers
 */
export function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null || distanceKm === undefined) {
    return 'Distance unavailable'
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000)
    return `${meters} m`
  }
  return `${distanceKm.toFixed(1)} km`
}

/**
 * Determines whether the couple is getting closer or moving farther
 */
export function calculateDistanceTrend(
  currentKm: number | null,
  previousKm: number | null
): 'getting_closer' | 'moving_farther' | 'steady' | 'unknown' {
  if (currentKm === null || previousKm === null) return 'unknown'
  const diff = currentKm - previousKm
  if (diff < -0.2) return 'getting_closer'
  if (diff > 0.2) return 'moving_farther'
  return 'steady'
}

/**
 * Formats relative timestamp
 */
export function formatTimeAgo(isoDate: string | null | undefined): string {
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

/**
 * Checks if location timestamp is considered stale (> 2 hours)
 */
export function isLocationStale(isoDate: string | null | undefined): boolean {
  if (!isoDate) return true
  const date = new Date(isoDate)
  const diffMs = Date.now() - date.getTime()
  return diffMs > 2 * 60 * 60 * 1000 // 2 hours
}
