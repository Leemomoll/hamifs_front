/**
 * 天气数据：Open-Meteo 免费接口，无需 key、支持 CORS。
 *
 * 流程：浏览器定位（带超时，失败回退默认坐标）→ 请求实时天气 →
 * 任何环节失败都返回静态兜底数据，保证主控台不因天气阻塞或报错。
 *
 * 后端就绪后：把 fetchCurrentWeather 换成 request('/api/weather') 即可，
 * 返回结构保持一致，页面无需改动。
 */

/** 兜底数据：网络不可用 / 定位被拒时展示 */
const FALLBACK = {
  simulated: true,
  temperature: 24,
  apparent: 26,
  humidity: 45,
  windSpeed: 12,
  code: 0,
}

/** 定位超时毫秒数 */
const GEO_TIMEOUT = 4000
/** 请求超时毫秒数 */
const FETCH_TIMEOUT = 6000

/** 默认坐标：北京 */
const DEFAULT_POSITION = { latitude: 39.9042, longitude: 116.4074 }

/** WMO weather code → 中文描述 / 图标 / 背景色调 */
const WMO_MAP = [
  { codes: [0], label: '晴', icon: '☀️', kind: 'sunny' },
  { codes: [1], label: '基本晴', icon: '🌤️', kind: 'sunny' },
  { codes: [2], label: '多云', icon: '⛅', kind: 'cloudy' },
  { codes: [3], label: '阴', icon: '☁️', kind: 'cloudy' },
  { codes: [45, 48], label: '雾', icon: '🌫️', kind: 'cloudy' },
  { codes: [51, 53, 55, 56, 57], label: '毛毛雨', icon: '🌦️', kind: 'rain' },
  { codes: [61, 63, 65, 66, 67], label: '雨', icon: '🌧️', kind: 'rain' },
  { codes: [71, 73, 75, 77, 85, 86], label: '雪', icon: '🌨️', kind: 'snow' },
  { codes: [80, 81, 82], label: '阵雨', icon: '🌦️', kind: 'rain' },
  { codes: [95, 96, 99], label: '雷阵雨', icon: '⛈️', kind: 'rain' },
]

/** code → { label, icon, kind }，未知 code 按多云处理 */
export function describeWeather(code) {
  const hit = WMO_MAP.find(item => item.codes.includes(code))
  return hit ? { label: hit.label, icon: hit.icon, kind: hit.kind } : { label: '多云', icon: '⛅', kind: 'cloudy' }
}

/** 浏览器定位，超时或被拒绝回退默认坐标 */
function getPosition() {
  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_POSITION)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(DEFAULT_POSITION),
      { timeout: GEO_TIMEOUT, maximumAge: 10 * 60 * 1000 },
    )
  })
}

/** 带超时的 fetch */
function fetchWithTimeout(url, ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer))
}

/**
 * 当前天气。
 * @returns {Promise<{simulated:boolean, temperature:number, apparent:number, humidity:number, windSpeed:number, code:number}>}
 * simulated 为 true 表示展示的是兜底数据
 */
export async function fetchCurrentWeather() {
  try {
    const { latitude, longitude } = await getPosition()
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m' +
      '&timezone=auto'
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT)
    if (!res.ok) throw new Error(`weather http ${res.status}`)
    const data = await res.json()
    const c = data.current
    return {
      simulated: false,
      temperature: Math.round(c.temperature_2m),
      apparent: Math.round(c.apparent_temperature),
      humidity: Math.round(c.relative_humidity_2m),
      windSpeed: Math.round(c.wind_speed_10m),
      code: c.weather_code,
    }
  } catch {
    return { ...FALLBACK }
  }
}
