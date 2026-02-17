/* ── Open-Meteo Historical Weather API ── */

export interface DailyWeather {
  date: string;          // YYYY-MM-DD
  tempMax: number;       // °C
  tempMin: number;       // °C
  tempMean: number;      // °C
  precipitation: number; // mm
}

export interface WeatherData {
  daily: DailyWeather[];
  latitude: number;
  longitude: number;
}

const cache = new Map<string, WeatherData>();

function cacheKey(lat: number, lng: number, start: string, end: string) {
  return `${lat.toFixed(2)},${lng.toFixed(2)},${start},${end}`;
}

/**
 * Fetch historical weather data from Open-Meteo (free, no API key).
 * Returns daily temperature and precipitation for the given date range.
 */
export async function fetchWeatherData(
  lat: number,
  lng: number,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
): Promise<WeatherData | null> {
  const key = cacheKey(lat, lng, startDate, endDate);
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url = new URL("https://archive-api.open-meteo.com/v1/archive");
    url.searchParams.set("latitude", lat.toFixed(4));
    url.searchParams.set("longitude", lng.toFixed(4));
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date", endDate);
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum");
    url.searchParams.set("timezone", "America/New_York");

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;

    const json = await res.json();
    const times: string[] = json.daily?.time ?? [];
    const maxTemps: (number | null)[] = json.daily?.temperature_2m_max ?? [];
    const minTemps: (number | null)[] = json.daily?.temperature_2m_min ?? [];
    const meanTemps: (number | null)[] = json.daily?.temperature_2m_mean ?? [];
    const precip: (number | null)[] = json.daily?.precipitation_sum ?? [];

    const daily: DailyWeather[] = [];
    for (let i = 0; i < times.length; i++) {
      if (maxTemps[i] != null && minTemps[i] != null && meanTemps[i] != null) {
        daily.push({
          date: times[i],
          tempMax: maxTemps[i]!,
          tempMin: minTemps[i]!,
          tempMean: meanTemps[i]!,
          precipitation: precip[i] ?? 0,
        });
      }
    }

    const data: WeatherData = { daily, latitude: lat, longitude: lng };
    cache.set(key, data);
    return data;
  } catch {
    return null;
  }
}
