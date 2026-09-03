// Two decimals: hours arrive as exact tenths, but summing hundreds of them in
// floating point leaves noise like 79892.7999999999 that must not reach the screen.
const numberFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export const formatNumber = (value: number) => numberFormat.format(value)

/** Formats an ISO `YYYY-MM-DD` string as e.g. "29 Dec" without local-timezone drift. */
export const formatDate = (isoDate: string) => dateFormat.format(new Date(`${isoDate}T00:00:00Z`))

/** Accent-insensitive, case-insensitive key for matching names. */
export const searchKey = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase()
