<template>
  <div ref="containerRef" :style="containerStyle">
    <!-- 紫色角色 -->
    <div ref="purpleRef" :style="purpleBodyStyle">
      <div ref="purpleFaceRef" :style="purpleFaceStyle">
        <EyeBall
          size="18px"
          pupil-size="7px"
          :max-distance="5"
          eye-color="white"
          pupil-color="#2D2D2D"
        />
        <EyeBall
          size="18px"
          pupil-size="7px"
          :max-distance="5"
          eye-color="white"
          pupil-color="#2D2D2D"
        />
      </div>
    </div>

    <!-- 黑色角色 -->
    <div ref="blackRef" :style="blackBodyStyle">
      <div ref="blackFaceRef" :style="blackFaceStyle">
        <EyeBall
          size="16px"
          pupil-size="6px"
          :max-distance="4"
          eye-color="white"
          pupil-color="#2D2D2D"
        />
        <EyeBall
          size="16px"
          pupil-size="6px"
          :max-distance="4"
          eye-color="white"
          pupil-color="#2D2D2D"
        />
      </div>
    </div>

    <!-- 橘黄色角色 -->
    <div ref="orangeRef" :style="orangeBodyStyle">
      <div ref="orangeFaceRef" :style="orangeFaceStyle">
        <Pupil size="12px" :max-distance="5" pupil-color="#2D2D2D" />
        <Pupil size="12px" :max-distance="5" pupil-color="#2D2D2D" />
      </div>
    </div>

    <!-- 黄色角色 -->
    <div ref="yellowRef" :style="yellowBodyStyle">
      <div ref="yellowFaceRef" :style="yellowFaceStyle">
        <Pupil size="12px" :max-distance="5" pupil-color="#2D2D2D" />
        <Pupil size="12px" :max-distance="5" pupil-color="#2D2D2D" />
      </div>
      <div ref="yellowMouthRef" :style="yellowMouthStyle" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import gsap from 'gsap'
import Pupil from './Pupil.vue'
import EyeBall from './EyeBall.vue'

const props = defineProps({
  /** 账号输入框聚焦中 */
  isTyping: { type: Boolean, default: false },
  /** 密码是否明文显示 */
  showPassword: { type: Boolean, default: false },
  /** 已输入密码长度（>0 才进入密码态） */
  passwordLength: { type: Number, default: 0 },
})

const containerRef = ref(null)
const mouseRef = reactive({ x: 0, y: 0 })
const rafIdRef = ref(0)

const purpleRef = ref(null)
const blackRef = ref(null)
const yellowRef = ref(null)
const orangeRef = ref(null)

const purpleFaceRef = ref(null)
const blackFaceRef = ref(null)
const yellowFaceRef = ref(null)
const orangeFaceRef = ref(null)

const yellowMouthRef = ref(null)

const purpleBlinkTimerRef = ref()
const purpleBlinkInnerTimerRef = ref()
const blackBlinkTimerRef = ref()
const blackBlinkInnerTimerRef = ref()
const purplePeekTimerRef = ref()
const purplePeekInnerTimerRef = ref()
const lookingTimerRef = ref()

const isHidingPassword = computed(() => props.passwordLength > 0 && !props.showPassword)
const isShowingPassword = computed(() => props.passwordLength > 0 && props.showPassword)

const isLookingRef = ref(false)

/** rAF 每帧读这个普通对象，避免高频触发响应式依赖收集 */
const stateRef = reactive({
  isTyping: false,
  isHidingPassword: false,
  isShowingPassword: false,
  isLooking: false,
})

watch(
  () => [props.isTyping, isHidingPassword.value, isShowingPassword.value, isLookingRef.value],
  ([isTyping, isHiding, isShowing, isLooking]) => {
    stateRef.isTyping = isTyping
    stateRef.isHidingPassword = isHiding
    stateRef.isShowingPassword = isShowing
    stateRef.isLooking = isLooking
  },
  { immediate: true }
)

/** GSAP quickTo 实例集合 */
const quickToRef = ref(null)

const containerStyle = {
  position: 'relative',
  width: '550px',
  height: '400px',
}

const purpleBodyStyle = {
  position: 'absolute',
  bottom: 0,
  left: '70px',
  width: '180px',
  height: '400px',
  backgroundColor: '#6C3FF5',
  borderRadius: '10px 10px 0 0',
  zIndex: 1,
  transformOrigin: 'bottom center',
  willChange: 'transform',
}

const blackBodyStyle = {
  position: 'absolute',
  bottom: 0,
  left: '240px',
  width: '120px',
  height: '310px',
  backgroundColor: '#2D2D2D',
  borderRadius: '8px 8px 0 0',
  zIndex: 2,
  transformOrigin: 'bottom center',
  willChange: 'transform',
}

const orangeBodyStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  width: '240px',
  height: '200px',
  backgroundColor: '#FF9B6B',
  borderRadius: '120px 120px 0 0',
  zIndex: 3,
  transformOrigin: 'bottom center',
  willChange: 'transform',
}

const yellowBodyStyle = {
  position: 'absolute',
  bottom: 0,
  left: '310px',
  width: '140px',
  height: '230px',
  backgroundColor: '#E8D754',
  borderRadius: '70px 70px 0 0',
  zIndex: 4,
  transformOrigin: 'bottom center',
  willChange: 'transform',
}

const purpleFaceStyle = {
  position: 'absolute',
  display: 'flex',
  gap: '32px',
  left: '45px',
  top: '40px',
}

const blackFaceStyle = {
  position: 'absolute',
  display: 'flex',
  gap: '24px',
  left: '26px',
  top: '32px',
}

const orangeFaceStyle = {
  position: 'absolute',
  display: 'flex',
  gap: '32px',
  left: '82px',
  top: '90px',
}

const yellowFaceStyle = {
  position: 'absolute',
  display: 'flex',
  gap: '24px',
  left: '52px',
  top: '40px',
}

const yellowMouthStyle = {
  position: 'absolute',
  width: '80px',
  height: '4px',
  backgroundColor: '#2D2D2D',
  borderRadius: '9999px',
  left: '40px',
  top: '88px',
}

/** 鼠标跟踪：只记坐标，动画统一在 rAF 里用 quickTo 插值 */
onMounted(() => {
  const container = containerRef.value
  if (
    !container ||
    !purpleRef.value ||
    !blackRef.value ||
    !orangeRef.value ||
    !yellowRef.value ||
    !purpleFaceRef.value ||
    !blackFaceRef.value ||
    !orangeFaceRef.value ||
    !yellowFaceRef.value ||
    !yellowMouthRef.value
  ) {
    return
  }

  // 只在组件自身范围内查找，避免多实例互相干扰
  gsap.set(container.querySelectorAll('.pupil'), { x: 0, y: 0 })
  gsap.set(container.querySelectorAll('.eyeball-pupil'), { x: 0, y: 0 })

  const qt = {
    purpleSkew: gsap.quickTo(purpleRef.value, 'skewX', { duration: 0.3, ease: 'power2.out' }),
    blackSkew: gsap.quickTo(blackRef.value, 'skewX', { duration: 0.3, ease: 'power2.out' }),
    orangeSkew: gsap.quickTo(orangeRef.value, 'skewX', { duration: 0.3, ease: 'power2.out' }),
    yellowSkew: gsap.quickTo(yellowRef.value, 'skewX', { duration: 0.3, ease: 'power2.out' }),
    purpleX: gsap.quickTo(purpleRef.value, 'x', { duration: 0.3, ease: 'power2.out' }),
    blackX: gsap.quickTo(blackRef.value, 'x', { duration: 0.3, ease: 'power2.out' }),
    purpleHeight: gsap.quickTo(purpleRef.value, 'height', { duration: 0.3, ease: 'power2.out' }),
    purpleFaceLeft: gsap.quickTo(purpleFaceRef.value, 'left', {
      duration: 0.3,
      ease: 'power2.out',
    }),
    purpleFaceTop: gsap.quickTo(purpleFaceRef.value, 'top', { duration: 0.3, ease: 'power2.out' }),
    blackFaceLeft: gsap.quickTo(blackFaceRef.value, 'left', { duration: 0.3, ease: 'power2.out' }),
    blackFaceTop: gsap.quickTo(blackFaceRef.value, 'top', { duration: 0.3, ease: 'power2.out' }),
    orangeFaceX: gsap.quickTo(orangeFaceRef.value, 'x', { duration: 0.2, ease: 'power2.out' }),
    orangeFaceY: gsap.quickTo(orangeFaceRef.value, 'y', { duration: 0.2, ease: 'power2.out' }),
    yellowFaceX: gsap.quickTo(yellowFaceRef.value, 'x', { duration: 0.2, ease: 'power2.out' }),
    yellowFaceY: gsap.quickTo(yellowFaceRef.value, 'y', { duration: 0.2, ease: 'power2.out' }),
    mouthX: gsap.quickTo(yellowMouthRef.value, 'x', { duration: 0.2, ease: 'power2.out' }),
    mouthY: gsap.quickTo(yellowMouthRef.value, 'y', { duration: 0.2, ease: 'power2.out' }),
  }
  quickToRef.value = qt

  /** 身体/脸部：取鼠标相对身体参考点（高度 1/3 处）的偏移向量，按比例缩小并限幅 */
  const calcPos = (el) => {
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 3
    const dx = mouseRef.x - cx
    const dy = mouseRef.y - cy
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      // 取负号：鼠标在右，身体反而向左倾，像探头去看
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    }
  }

  /** 眼球：只取方向（atan2），距离按 maxDist 截断，保证瞳孔不跑出眼眶 */
  const calcEyePos = (el, maxDist) => {
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const dx = mouseRef.x - cx
    const dy = mouseRef.y - cy
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDist)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const tick = () => {
    const el = containerRef.value
    if (!el) return

    const { isTyping: typing, isHidingPassword: hiding, isShowingPassword: showing, isLooking: looking } = stateRef

    if (purpleRef.value && !showing) {
      const pp = calcPos(purpleRef.value)
      if (typing || hiding) {
        qt.purpleSkew(pp.bodySkew - 12)
        qt.purpleX(40)
        qt.purpleHeight(440)
      } else {
        qt.purpleSkew(pp.bodySkew)
        qt.purpleX(0)
        qt.purpleHeight(400)
      }
    }

    if (blackRef.value && !showing) {
      const bp = calcPos(blackRef.value)
      if (looking) {
        qt.blackSkew(bp.bodySkew * 1.5 + 10)
        qt.blackX(20)
      } else if (typing || hiding) {
        qt.blackSkew(bp.bodySkew * 1.5)
        qt.blackX(0)
      } else {
        qt.blackSkew(bp.bodySkew)
        qt.blackX(0)
      }
    }

    if (orangeRef.value && !showing) {
      qt.orangeSkew(calcPos(orangeRef.value).bodySkew)
    }

    if (yellowRef.value && !showing) {
      qt.yellowSkew(calcPos(yellowRef.value).bodySkew)
    }

    if (purpleRef.value && !showing && !looking) {
      const pp = calcPos(purpleRef.value)
      const purpleFaceX = pp.faceX >= 0 ? Math.min(25, pp.faceX * 1.5) : pp.faceX
      qt.purpleFaceLeft(45 + purpleFaceX)
      qt.purpleFaceTop(40 + pp.faceY)
    }

    if (blackRef.value && !showing && !looking) {
      const bp = calcPos(blackRef.value)
      qt.blackFaceLeft(26 + bp.faceX)
      qt.blackFaceTop(32 + bp.faceY)
    }

    if (orangeRef.value && !showing) {
      const op = calcPos(orangeRef.value)
      qt.orangeFaceX(op.faceX)
      qt.orangeFaceY(op.faceY)
    }

    if (yellowRef.value && !showing) {
      const yp = calcPos(yellowRef.value)
      qt.yellowFaceX(yp.faceX)
      qt.yellowFaceY(yp.faceY)
      qt.mouthX(yp.faceX)
      qt.mouthY(yp.faceY)
    }

    if (!showing) {
      el.querySelectorAll('.pupil').forEach((p) => {
        const maxDist = Number(p.dataset.maxDistance) || 5
        const ePos = calcEyePos(p, maxDist)
        gsap.set(p, { x: ePos.x, y: ePos.y })
      })

      if (!looking) {
        el.querySelectorAll('.eyeball').forEach((eb) => {
          const maxDist = Number(eb.dataset.maxDistance) || 10
          const pupil = eb.querySelector('.eyeball-pupil')
          if (!pupil) return
          const ePos = calcEyePos(eb, maxDist)
          gsap.set(pupil, { x: ePos.x, y: ePos.y })
        })
      }
    }

    rafIdRef.value = requestAnimationFrame(tick)
  }

  const onMove = (e) => {
    mouseRef.x = e.clientX
    mouseRef.y = e.clientY
  }

  // 页面切到后台时停掉循环，回来再接上
  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(rafIdRef.value)
      rafIdRef.value = 0
    } else if (!rafIdRef.value) {
      rafIdRef.value = requestAnimationFrame(tick)
    }
  }

  window.addEventListener('mousemove', onMove, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  rafIdRef.value = requestAnimationFrame(tick)

  onBeforeUnmount(() => {
    window.removeEventListener('mousemove', onMove)
    document.removeEventListener('visibilitychange', onVisibility)
    cancelAnimationFrame(rafIdRef.value)
  })
})

/** 紫色角色眨眼 */
onMounted(() => {
  const purpleEyeballs = purpleRef.value?.querySelectorAll('.eyeball')
  if (!purpleEyeballs?.length) return

  const scheduleBlink = () => {
    purpleBlinkTimerRef.value = setTimeout(() => {
      purpleEyeballs.forEach((el) => {
        gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' })
      })
      purpleBlinkInnerTimerRef.value = setTimeout(() => {
        purpleEyeballs.forEach((el) => {
          const size = Number(el.style.width.replace('px', '')) || 18
          gsap.to(el, { height: size, duration: 0.08, ease: 'power2.out' })
        })
        scheduleBlink()
      }, 150)
    }, Math.random() * 4000 + 3000)
  }

  scheduleBlink()
})

/** 黑色角色眨眼 */
onMounted(() => {
  const blackEyeballs = blackRef.value?.querySelectorAll('.eyeball')
  if (!blackEyeballs?.length) return

  const scheduleBlink = () => {
    blackBlinkTimerRef.value = setTimeout(() => {
      blackEyeballs.forEach((el) => {
        gsap.to(el, { height: 2, duration: 0.08, ease: 'power2.in' })
      })
      blackBlinkInnerTimerRef.value = setTimeout(() => {
        blackEyeballs.forEach((el) => {
          const size = Number(el.style.width.replace('px', '')) || 16
          gsap.to(el, { height: size, duration: 0.08, ease: 'power2.out' })
        })
        scheduleBlink()
      }, 150)
    }, Math.random() * 4000 + 3000)
  }

  scheduleBlink()
})

/** 输入账号时：紫黑两个角色互相对视 */
const applyLookAtEachOther = () => {
  const qt = quickToRef.value
  if (qt) {
    qt.purpleFaceLeft(55)
    qt.purpleFaceTop(65)
    qt.blackFaceLeft(32)
    qt.blackFaceTop(12)
  }
  purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: 3, y: 4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
  blackRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => {
    gsap.to(p, { x: 0, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
  })
}

/** 输入密码（密文）：紫色角色挡住眼睛 */
const applyHidingPassword = () => {
  const qt = quickToRef.value
  if (qt) {
    qt.purpleFaceLeft(55)
    qt.purpleFaceTop(65)
  }
}

/** 明文显示密码：全体歪头看向别处 */
const applyShowPassword = () => {
  const qt = quickToRef.value
  if (qt) {
    qt.purpleSkew(0)
    qt.blackSkew(0)
    qt.orangeSkew(0)
    qt.yellowSkew(0)
    qt.purpleX(0)
    qt.blackX(0)
    qt.purpleHeight(400)

    qt.purpleFaceLeft(20)
    qt.purpleFaceTop(35)
    qt.blackFaceLeft(10)
    qt.blackFaceTop(28)
    qt.orangeFaceX(50 - 82)
    qt.orangeFaceY(85 - 90)
    qt.yellowFaceX(20 - 52)
    qt.yellowFaceY(35 - 40)
    qt.mouthX(10 - 40)
    qt.mouthY(0)
  }

  const lookAway = { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }
  const lookAway2 = { x: -5, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }
  purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => gsap.to(p, lookAway))
  blackRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => gsap.to(p, lookAway))
  orangeRef.value?.querySelectorAll('.pupil').forEach((p) => gsap.to(p, lookAway2))
  yellowRef.value?.querySelectorAll('.pupil').forEach((p) => gsap.to(p, lookAway2))
}

/** 明文状态下，紫色角色偶尔偷看一眼 */
watch(
  () => [isShowingPassword.value, props.passwordLength],
  ([showing, len]) => {
    clearTimeout(purplePeekTimerRef.value)
    clearTimeout(purplePeekInnerTimerRef.value)
    if (!showing || len <= 0) return

    const purpleEyePupils = purpleRef.value?.querySelectorAll('.eyeball-pupil')
    if (!purpleEyePupils?.length) return

    const schedulePeek = () => {
      purplePeekTimerRef.value = setTimeout(() => {
        purpleEyePupils.forEach((p) => {
          gsap.to(p, { x: 4, y: 5, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
        })
        const qt = quickToRef.value
        if (qt) {
          qt.purpleFaceLeft(20)
          qt.purpleFaceTop(35)
        }

        purplePeekInnerTimerRef.value = setTimeout(() => {
          purpleEyePupils.forEach((p) => {
            gsap.to(p, { x: -4, y: -4, duration: 0.3, ease: 'power2.out', overwrite: 'auto' })
          })
          schedulePeek()
        }, 800)
      }, Math.random() * 3000 + 2000)
    }

    schedulePeek()
  }
)

/** 开始输入账号的 800ms 内，两个角色互相对视 */
watch(
  () => [props.isTyping, isShowingPassword.value],
  ([typing, showing]) => {
    clearTimeout(lookingTimerRef.value)
    if (typing && !showing) {
      isLookingRef.value = true
      stateRef.isLooking = true
      applyLookAtEachOther()

      lookingTimerRef.value = setTimeout(() => {
        isLookingRef.value = false
        stateRef.isLooking = false
        purpleRef.value?.querySelectorAll('.eyeball-pupil').forEach((p) => gsap.killTweensOf(p))
      }, 800)
    } else {
      isLookingRef.value = false
      stateRef.isLooking = false
    }
  }
)

/** 密码态切换 */
watch(
  () => [isShowingPassword.value, isHidingPassword.value],
  ([showing, hiding]) => {
    if (showing) {
      applyShowPassword()
    } else if (hiding) {
      applyHidingPassword()
    }
  }
)

onBeforeUnmount(() => {
  clearTimeout(purpleBlinkTimerRef.value)
  clearTimeout(purpleBlinkInnerTimerRef.value)
  clearTimeout(blackBlinkTimerRef.value)
  clearTimeout(blackBlinkInnerTimerRef.value)
  clearTimeout(purplePeekTimerRef.value)
  clearTimeout(purplePeekInnerTimerRef.value)
  clearTimeout(lookingTimerRef.value)
  gsap.killTweensOf(containerRef.value?.querySelectorAll('*') ?? [])
})
</script>
