const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

function normalizeDegrees(value: number) {
  let result = value % 360;
  if (result < 0) result += 360;
  return result;
}

function normalizeHours(value: number) {
  let result = value % 24;
  if (result < 0) result += 24;
  return result;
}

function dayOfYear(date: Date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((current - start) / 86_400_000) + 1;
}

/**
 * Classic Sunrise/Sunset almanac algorithm (edwilliams.org/sunrise_sunset_algorithm.htm),
 * accurate to within a minute or two, no external API required.
 */
function computeUtcHour(date: Date, latitude: number, longitude: number, isSunrise: boolean) {
  const zenith = 90.833;
  const dayOfYearValue = dayOfYear(date);
  const lngHour = longitude / 15;
  const t = isSunrise ? dayOfYearValue + (6 - lngHour) / 24 : dayOfYearValue + (18 - lngHour) / 24;

  const meanAnomaly = 0.9856 * t - 3.289;
  let trueLongitude =
    meanAnomaly +
    1.916 * Math.sin(toRadians(meanAnomaly)) +
    0.02 * Math.sin(toRadians(2 * meanAnomaly)) +
    282.634;
  trueLongitude = normalizeDegrees(trueLongitude);

  let rightAscension = toDegrees(Math.atan(0.91764 * Math.tan(toRadians(trueLongitude))));
  rightAscension = normalizeDegrees(rightAscension);
  const longitudeQuadrant = Math.floor(trueLongitude / 90) * 90;
  const raQuadrant = Math.floor(rightAscension / 90) * 90;
  rightAscension = (rightAscension + (longitudeQuadrant - raQuadrant)) / 15;

  const sinDeclination = 0.39782 * Math.sin(toRadians(trueLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const cosHourAngle =
    (Math.cos(toRadians(zenith)) - sinDeclination * Math.sin(toRadians(latitude))) /
    (cosDeclination * Math.cos(toRadians(latitude)));

  if (cosHourAngle > 1 || cosHourAngle < -1) {
    return null;
  }

  let hourAngle = isSunrise ? 360 - toDegrees(Math.acos(cosHourAngle)) : toDegrees(Math.acos(cosHourAngle));
  hourAngle /= 15;

  const localMeanTime = hourAngle + rightAscension - 0.06571 * t - 6.622;
  return normalizeHours(localMeanTime - lngHour);
}

function formatUtcHourInTimeZone(utcHour: number, timeZoneOffsetHours: number) {
  const totalMinutes = Math.round((utcHour + timeZoneOffsetHours) * 60);
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getSunTimes(
  date: Date,
  latitude: number,
  longitude: number,
  timeZoneOffsetHours: number
): { sunrise: string | null; sunset: string | null } {
  const sunriseUtc = computeUtcHour(date, latitude, longitude, true);
  const sunsetUtc = computeUtcHour(date, latitude, longitude, false);

  return {
    sunrise: sunriseUtc === null ? null : formatUtcHourInTimeZone(sunriseUtc, timeZoneOffsetHours),
    sunset: sunsetUtc === null ? null : formatUtcHourInTimeZone(sunsetUtc, timeZoneOffsetHours)
  };
}
