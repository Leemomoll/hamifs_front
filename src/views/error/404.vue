<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-result icon="warning" title="404" sub-title="抱歉，你访问的页面不存在">
        <template #extra>
          <el-button type="primary" @click="router.push('/')">返回首页</el-button>
        </template>
      </el-result>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
