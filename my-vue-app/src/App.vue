<script setup>
import { useAuthStore } from "@/stores/useAuthStore"
import Navbar from "@/components/Navbar.vue"
import { useRoute } from "vue-router"

const authStore = useAuthStore()
const route = useRoute()
</script>

<template>
  <Navbar v-if="authStore.isAuthenticated && route.path !== '/login' && route.path !== '/register'" />
  <router-view />
</template>

<style>
[v-cloak] {
  display: none;
}

.loading {
  min-height: 100vh;
}
</style>
