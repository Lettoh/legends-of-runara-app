<script setup lang="ts">
import useAuth from "../useAuth.ts";

const { authenticated, user, logout } = useAuth()

defineProps<{ msg: string }>()

</script>

<template>
  <h1>Hello {{ user.name }} !</h1>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
