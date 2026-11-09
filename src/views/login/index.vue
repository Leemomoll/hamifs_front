<template>
  <div class="login-container" :class="{ 'is-peeking': isPeeking }">
    <!-- 左侧：品牌视觉区（动画角色） -->
    <div class="left-panel">
      <div class="left-inner">
        <div
          class="brand"
          @pointerdown="startLongPress"
          @pointerup="cancelLongPress"
          @pointerleave="cancelLongPress"
          @pointercancel="cancelLongPress"
          @contextmenu.prevent
        >
          <img class="brand-logo" :src="logoUrl" alt="hamifs" />
          <span class="brand-name">hamifs</span>
        </div>

        <div class="characters-area">
          <div class="characters-scale">
            <AnimatedCharacters
              :is-typing="isTyping"
              :show-password="showPassword"
              :password-length="form.password.length"
            />
          </div>
        </div>

        <div class="left-footer">
          <a href="#">帮助中心</a>
          <a href="#">隐私政策</a>
        </div>
      </div>

      <div class="decor-blur-1" />
      <div class="decor-blur-2" />
      <div class="decor-grid" />
    </div>

    <!-- 右侧：登录表单 -->
    <div class="right-panel">
      <div class="form-wrapper">
        <div class="mobile-logo">
          <img class="brand-logo" :src="logoUrl" alt="hamifs" />
          <span>hamifs</span>
        </div>

        <div class="form-header">
          <h1 class="form-title">登录到工作台</h1>
          <p class="form-subtitle">统一接入前端平台旗下所有系统</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          size="large"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="输入您的账号"
              @focus="isTyping = true"
              @blur="isTyping = false"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="输入您的密码"
              @focus="passwordFocused = true"
              @blur="passwordFocused = false"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
              <template #suffix>
                <el-icon class="eye-toggle" @click="showPassword = !showPassword">
                  <View v-if="showPassword" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <div class="form-extra">
            <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
            <a href="#" class="forgot-link">忘记密码？</a>
          </div>

          <div v-if="error" class="error-box">{{ error }}</div>

          <el-form-item class="submit-item">
            <el-button type="primary" class="submit-btn" :loading="loading" @click="handleLogin">
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="signup-row">
          暂无账号？
          <a href="#" class="signup-link">联系管理员申请开通</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import AnimatedCharacters from '@/components/AnimatedCharacters/Index.vue'
import logoUrl from '@/assets/logo.svg'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const showPassword = ref(false)
const isTyping = ref(false)
const passwordFocused = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: '',
  // 勾选后后端下发 7 天有效期的 token，不勾选是 2 小时
  rememberMe: false,
})

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号长度不能少于 3 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' },
  ],
}

/**
 * 正在输密码时整块视觉向右靠：左栏内容右移 + 分界线右移，
 * 配合角色动画（紫色角色起身遮挡）形成"凑过来看"的感觉
 */
/**
 * 长按通道（开发后门）：长按品牌区 1.2 秒免登录直接进系统。
 * 配合鉴权开关关闭（VITE_AUTH_ENABLED=false）使用；不留任何视觉痕迹。
 * 后端在线、鉴权开启时，守卫仍会正常拦截，该通道只对已登录/已放行状态有效。
 */
const LONG_PRESS_MS = 1200
let longPressTimer = null

const enterWithoutLogin = () => {
  longPressTimer = null
  // 与正常登录一致：优先回到被守卫拦下来的深链接
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  router.push(redirect || '/dashboard/index')
}

const startLongPress = () => {
  cancelLongPress()
  longPressTimer = setTimeout(enterWithoutLogin, LONG_PRESS_MS)
}

const cancelLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

onBeforeUnmount(cancelLongPress)

const isPeeking = computed(
  () => passwordFocused.value && form.password.length > 0 && !showPassword.value
)

const handleLogin = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  error.value = ''
  try {
    await userStore.login({
      username: form.username,
      password: form.password,
      rememberMe: form.rememberMe,
    })
    ElMessage.success('登录成功')
    // 被守卫拦下来的深链接，登录后回到原来想去的那一页
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    router.push(redirect || '/dashboard/index')
  } catch (err) {
    error.value = err?.message || '账号或密码有误，请重新输入'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  width: 100%;
  height: 100%;
}

/* ─── 左侧面板 ───────────────────────────────────────────────────────────── */
.left-panel {
  position: relative;
  /* 左右对半分（登录区由 1/3 扩到 1/2，即原来的 1.5 倍） */
  flex: 1 1 0;
  min-width: 0;
  padding: 40px 48px 32px;
  overflow: hidden;
  background: linear-gradient(145deg, #0a1633 0%, #123a8a 50%, #165dff 100%);
  transition: flex-grow 0.55s cubic-bezier(0.33, 1, 0.68, 1);
}

/* 内容整体承载层：输密码时向右平移，营造"凑过来看" */
.left-inner {
  position: relative;
  z-index: 20;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  transition: transform 0.55s cubic-bezier(0.33, 1, 0.68, 1);
}

.is-peeking .left-inner {
  transform: translateX(28px);
}

/* ─── 品牌 + 长按通道 ───────────────────────────────────────────────────── */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  /* 长按通道不留任何视觉痕迹，仅禁止长按选中 / 系统长按菜单 */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

.brand-logo {
  width: 28px;
  height: 28px;
  object-fit: cover;
  border-radius: 6px;
}

/* ─── 角色展示区（在左栏内居中） ─────────────────────────────────────────── */
.characters-area {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
}

.characters-scale {
  width: 550px;
  height: 400px;
  transform: scale(var(--char-scale, 1));
  transform-origin: center center;
}

.left-footer {
  position: relative;
  z-index: 20;
  display: flex;
  gap: 24px;
  font-size: 13px;
}

.left-footer a {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: color 0.2s;
}

.left-footer a:hover {
  color: #fff;
}

.decor-blur-1,
.decor-blur-2 {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  z-index: 0;
}

.decor-blur-1 {
  top: 15%;
  right: 10%;
  width: 300px;
  height: 300px;
  background: rgba(22, 93, 255, 0.28);
}

.decor-blur-2 {
  bottom: 10%;
  left: 8%;
  width: 240px;
  height: 240px;
  background: rgba(255, 255, 255, 0.12);
}

.decor-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* ─── 右侧面板 ───────────────────────────────────────────────────────────── */
.right-panel {
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
  background-color: #fff;
  transition: flex-grow 0.55s cubic-bezier(0.33, 1, 0.68, 1);
}

/* 输密码时分界线跟着往右挪一点（左 1 → 1.08，右 1 → 0.92） */
.is-peeking .left-panel {
  flex-grow: 1.08;
}

.is-peeking .right-panel {
  flex-grow: 0.92;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
  padding: 0 24px;
}

.mobile-logo {
  position: relative;
  display: none;
  align-items: center;
  gap: 8px;
  margin-bottom: 32px;
  font-size: 18px;
  font-weight: 700;
  color: var(--hamifs-text-primary);
}

.form-header {
  margin-bottom: 28px;
}

.form-title {
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: 700;
  color: var(--hamifs-text-primary);
}

.form-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--hamifs-text-secondary);
}

.eye-toggle {
  cursor: pointer;
}

.form-extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  font-size: 13px;
}

.forgot-link {
  color: var(--hamifs-text-secondary);
  text-decoration: none;
}

.forgot-link:hover {
  color: var(--hamifs-primary);
}

.error-box {
  margin-bottom: 18px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
  border-radius: 6px;
}

.submit-item {
  margin-bottom: 0;
}

.submit-btn {
  width: 100%;
}

.signup-row {
  margin-top: 24px;
  font-size: 13px;
  text-align: center;
  color: var(--hamifs-text-secondary);
}

.signup-link {
  color: var(--hamifs-primary);
  text-decoration: none;
}

/* 角色固定 550px 宽，窗口变窄时等比缩放，避免被裁切 */
@media (max-width: 1340px) {
  .characters-scale {
    --char-scale: 0.95;
  }
}

@media (max-width: 1180px) {
  .characters-scale {
    --char-scale: 0.85;
  }
}

@media (max-width: 1080px) {
  .characters-scale {
    --char-scale: 0.75;
  }
}

@media (max-width: 1024px) {
  .left-panel {
    display: none;
  }

  .right-panel,
  .is-peeking .right-panel {
    flex: 1 1 auto;
  }

  .mobile-logo {
    display: flex;
  }
}
</style>
