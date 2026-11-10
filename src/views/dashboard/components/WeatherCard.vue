<template>
  <div class="weather-card" :class="`kind-${weatherDesc.kind}`">
    <!-- 左：问候 + 日期 -->
    <div class="block greeting">
      <div class="hello">{{ greeting }}，{{ nickname }}</div>
      <div class="date">
        {{ dateText }}
        <span class="weekday">{{ weekdayText }}</span>
      </div>
      <div v-if="weather.simulated" class="sim-flag">离线示例数据</div>
    </div>

    <!-- 中：天气主体 -->
    <div class="block weather-main">
      <span class="weather-icon">{{ weatherDesc.icon }}</span>
      <div class="weather-text">
        <div class="weather-label">{{ weatherDesc.label }}</div>
        <div class="weather-temp">{{ weather.temperature }}°C</div>
      </div>
      <div class="weather-feels">体感 {{ weather.apparent }}°C</div>
    </div>

    <!-- 右：细分指标 -->
    <div class="block metrics">
      <div class="metric">
        <span class="metric-icon">💧</span>
        <div class="metric-body">
          <div class="metric-value">{{ weather.humidity }}%</div>
          <div class="metric-name">湿度</div>
        </div>
      </div>
      <div class="metric">
        <span class="metric-icon">🍃</span>
        <div class="metric-body">
          <div class="metric-value">{{ weather.windSpeed }} km/h</div>
          <div class="metric-name">风速</div>
        </div>
      </div>
      <div class="metric">
        <span class="metric-icon">✨</span>
        <div class="metric-body">
          <div class="metric-value">{{ lunarText }}</div>
          <div class="metric-name">农历年</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchCurrentWeather, describeWeather } from '@/api/weather'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const weather = ref({
  simulated: true,
  temperature: 24,
  apparent: 26,
  humidity: 45,
  windSpeed: 12,
  code: 0,
})
const now = ref(new Date())
let clockTimer = null

const nickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.name || userStore.userInfo?.username || '朋友')

const dateText = computed(() => {
  const d = now.value
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
})

const weekdayText = computed(() => WEEKDAYS[now.value.getDay()])

/** 时段问候 */
const greeting = computed(() => {
  const h = now.value.getHours()
  if (h < 6) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const weatherDesc = computed(() => describeWeather(weather.value.code))

/** 简版农历：干支年 + 生肖（精确农历日需要历法库，后端就绪后由接口提供） */
const lunarText = computed(() => {
  const stems = '甲乙丙丁戊己庚辛壬癸'
  const branches = '子丑寅卯辰巳午未申酉戌亥'
  const animals = '鼠牛虎兔龙蛇马羊猴鸡狗猪'
  const idx = (now.value.getFullYear() - 4) % 60
  return `${stems[idx % 10]}${branches[idx % 12]}${animals[idx % 12]}年`
})

onMounted(async () => {
  clockTimer = setInterval(() => {
    now.value = new Date()
  }, 30 * 1000)
  weather.value = await fetchCurrentWeather()
})

onBeforeUnmount(() => {
  clearInterval(clockTimer)
})
</script>

<style scoped>
.weather-card {
  display: flex;
  align-items: stretch;
  gap: 24px;
  padding: 20px 28px;
  margin-bottom: 16px;
  color: #fff;
  border-radius: var(--hamifs-radius);
  background:
    radial-gradient(120% 180% at 90% 10%, rgba(255, 255, 255, 0.18) 0%, transparent 55%),
    linear-gradient(105deg, #165dff 0%, #3b82f6 55%, #60a5fa 100%);
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.25);
  transition: background 0.6s;
}

/* 按天气切换色调 */
.weather-card.kind-cloudy {
  background:
    radial-gradient(120% 180% at 90% 10%, rgba(255, 255, 255, 0.16) 0%, transparent 55%),
    linear-gradient(105deg, #4b5b76 0%, #64748b 60%, #94a3b8 100%);
  box-shadow: 0 4px 16px rgba(71, 85, 105, 0.25);
}

.weather-card.kind-rain {
  background:
    radial-gradient(120% 180% at 90% 10%, rgba(255, 255, 255, 0.14) 0%, transparent 55%),
    linear-gradient(105deg, #1e3a5f 0%, #2563eb 60%, #38bdf8 100%);
  box-shadow: 0 4px 16px rgba(30, 58, 95, 0.3);
}

.weather-card.kind-snow {
  background:
    radial-gradient(120% 180% at 90% 10%, rgba(255, 255, 255, 0.2) 0%, transparent 55%),
    linear-gradient(105deg, #5b7c99 0%, #7da7c4 60%, #b6d4e3 100%);
  box-shadow: 0 4px 16px rgba(91, 124, 153, 0.3);
}

.block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.greeting {
  flex: 1.2;
}

.hello {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.date {
  margin-top: 6px;
  font-size: 15px;
  opacity: 0.92;
}

.weekday {
  margin-left: 10px;
  font-size: 13px;
  opacity: 0.8;
}

.sim-flag {
  margin-top: 8px;
  align-self: flex-start;
  padding: 1px 8px;
  font-size: 11px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  opacity: 0.75;
}

.weather-main {
  flex: 1;
  align-items: flex-start;
}

.weather-icon {
  font-size: 42px;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
}

.weather-text {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin-top: 4px;
}

.weather-label {
  font-size: 15px;
  opacity: 0.92;
}

.weather-temp {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
}

.weather-feels {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.78;
}

.metrics {
  flex-direction: row;
  align-items: center;
  gap: 18px;
}

.metric {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.metric-icon {
  font-size: 22px;
}

.metric-value {
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
}

.metric-name {
  font-size: 12px;
  opacity: 0.75;
}

/* 窄屏：指标换行 */
@media (max-width: 1100px) {
  .weather-card {
    flex-wrap: wrap;
  }

  .metrics {
    flex-basis: 100%;
    justify-content: space-between;
  }
}
</style>
