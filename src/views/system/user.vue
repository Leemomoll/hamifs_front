<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <!-- 搜索区 -->
      <el-form :inline="true" :model="query" class="search-form" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            placeholder="账号 / 姓名 / 手机号"
            clearable
            style="width: 200px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 列表 -->
      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" min-width="170" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无用户数据" />
        </template>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" :disabled="isEdit" placeholder="登录账号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isEdit ? '留空表示不修改' : '至少 6 位'"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="邮箱" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createUser, deleteUser, getUserList, updateUser } from '@/api/user'

/**
 * 后端分页字段暂未最终确认，这里统一在 normalizeResult 里做兼容：
 * list / records / content 都能认，total 缺失时按当前页行数兜底。
 * 等后端字段定死，删掉这个函数直接用 res.list / res.total 即可。
 */
const normalizeResult = raw => {
  const rows = raw?.list ?? raw?.records ?? raw?.content ?? (Array.isArray(raw) ? raw : [])
  return {
    list: Array.isArray(rows) ? rows : [],
    total: Number(raw?.total ?? (Array.isArray(rows) ? rows.length : 0)),
  }
}

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const total = ref(0)

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: '',
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = { pageNum: query.pageNum, pageSize: query.pageSize }
    if (query.keyword.trim()) params.keyword = query.keyword.trim()
    if (query.status !== '' && query.status !== null && query.status !== undefined) {
      params.status = query.status
    }
    const res = await getUserList(params)
    const { list, total: count } = normalizeResult(res)
    tableData.value = list
    total.value = count
  } catch (err) {
    ElMessage.error(err?.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.pageNum = 1
  fetchList()
}

const handleReset = () => {
  query.keyword = ''
  query.status = ''
  query.pageNum = 1
  fetchList()
}

/* ===== 新增 / 编辑 ===== */
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)

const createForm = () => ({
  id: null,
  username: '',
  password: '',
  name: '',
  phone: '',
  email: '',
  status: 1,
})
const form = reactive(createForm())

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, message: '账号长度不能少于 3 个字符', trigger: 'blur' },
  ],
  password: [
    {
      validator: (rule, value, callback) => {
        // 编辑时留空表示不改密码
        if (!isEdit.value && (value === '' || value === undefined)) {
          callback(new Error('请输入密码'))
          return
        }
        if (value && String(value).length < 6) {
          callback(new Error('密码长度不能少于 6 位'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
}

const openDialog = row => {
  Object.assign(form, createForm(), row || {})
  form.password = ''
  dialogVisible.value = true
  formRef.value?.clearValidate()
}

const openCreate = () => {
  isEdit.value = false
  openDialog()
}

const openEdit = row => {
  isEdit.value = true
  openDialog({ ...row })
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = {
      username: form.username,
      name: form.name,
      phone: form.phone,
      email: form.email,
      status: form.status,
    }
    // 密码为空表示不修改（编辑场景）
    if (form.password) payload.password = form.password

    if (isEdit.value) {
      await updateUser(form.id, payload)
      ElMessage.success('修改成功')
    } else {
      await createUser(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchList()
  } catch (err) {
    ElMessage.error(err?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

/* ===== 删除 ===== */
const handleDelete = async row => {
  try {
    await ElMessageBox.confirm(`确定要删除用户「${row.username}」吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    // 删到当前页最后一条时，往前翻一页
    if (tableData.value.length === 1 && query.pageNum > 1) {
      query.pageNum -= 1
    }
    fetchList()
  } catch (err) {
    ElMessage.error(err?.message || '删除失败')
  }
}

onMounted(fetchList)
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-form {
  margin-bottom: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
