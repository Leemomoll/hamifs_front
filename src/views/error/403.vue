<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-result icon="warning" title="403" sub-title="抱歉，你没有权限访问该页面">
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
