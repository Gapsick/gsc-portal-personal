// router/index.js
import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "@/stores/useAuthStore"
import Login from "@/views/Login.vue"
import Main from "@/views/Main.vue"
import Schedule from "@/views/Schedule.vue"
import Register from "@/views/Register.vue"

import AdminDashboard from '@/views/admin/AdminDashboard.vue'
import ManageUsers from '@/views/admin/ManageUsers.vue'
import ManageSubjects from '@/views/admin/ManageSubjects.vue'
import ManageTimetable from '@/views/admin/ManageTimetable.vue'

import NoticeList from "@/views/Notice.vue"
import NoticeDetail from "@/views/NoticeDetail.vue"
import NoticeWrite from "@/views/NoticeWrite.vue"
import NoticeEdit from "@/views/NoticeEdit.vue"

import Timetable from "@/views/Timetable.vue"

import LineConnect from "@/views/LineConnect.vue"

const routes = [
  { 
    path: "/", 
    redirect: '/main'
  },
  { 
    path: "/main", 
    component: Main,
    meta: { requiresAuth: true }
  },
  { 
    path: "/login", 
    component: Login,
    meta: { requiresGuest: true }
  },
  { 
    path: "/schedule", 
    component: Schedule,
    meta: { requiresAuth: true }
  },
  { 
    path: "/register", 
    component: Register,
    meta: { requiresGuest: true }
  },
  { 
    path: "/line-connect", 
    component: LineConnect,
    meta: { requiresAuth: true }
  },

  {
    path: "/admin",
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: "users", component: ManageUsers },
      { path: "subjects", component: ManageSubjects },
      { path: "timetable", component: ManageTimetable },
    ],
  },

  { 
    path: "/notices", 
    component: NoticeList,
    meta: { requiresAuth: true }
  },
  { 
    path: "/notices/:id", 
    component: NoticeDetail,
    meta: { requiresAuth: true }
  },
  { 
    path: "/notices/write", 
    component: NoticeWrite,
    meta: { requiresAuth: true }
  },
  { 
    path: "/notices/edit/:id", 
    component: NoticeEdit,
    meta: { requiresAuth: true }
  },

  { 
    path: "/timetable", 
    component: Timetable,
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 전역 네비게이션 가드
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 페이지 이동 시마다 인증 상태 체크
  await authStore.checkAuth()
  
  // 인증이 필요한 페이지에 접근하려고 할 때
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }
  
  // 게스트 전용 페이지(로그인, 회원가입)에 인증된 사용자가 접근하려고 할 때
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/main')
    return
  }
  
  // 관리자 권한이 필요한 페이지에 일반 사용자가 접근하려고 할 때
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/main')
    return
  }
  
  next()
})

export default router
