<script setup lang="ts">
import useAuth from "../../useAuth.ts";
import {reactive, ref} from "vue";
import router from "../../router.ts";
import Loader from "../Tools/Loader.vue";

const { login } = useAuth()
const loading = ref(false);

const form = reactive({
  email: '',
  password: '',
})


async function log(form:any) {
  loading.value = true
  try {
    const ok = await login(form)
    if (ok) await router.replace({ name: 'team.me' })
  } catch (e) {
    console.log(e)
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div v-if="loading === true">
    <Loader />
  </div>
  <div v-else class="min-w-xl">
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <img src="../../assets/runara_logo.png" alt="Your Company" class="mx-auto w-100 w-auto" />
      <h2 class="mt-1 text-center text-2xl/9 font-bold tracking-tight text-white">Connexion</h2>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <form action="#" method="POST" class="space-y-6" v-on:submit.prevent="log(form)">
        <div>
          <label for="email" class="block text-sm/6 font-medium text-gray-100">Adresse mail</label>
          <div class="mt-2">
            <input v-model="form.email" id="email" type="email" name="email" required autocomplete="email" class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <label for="password" class="block text-sm/6 font-medium text-gray-100">Mot de passe</label>
            <div class="text-sm">
              <a href="#" class="font-semibold text-indigo-400 hover:text-indigo-300">Mot de passe oublié ?</a>
            </div>
          </div>
          <div class="mt-2">
            <input v-model="form.password" id="password" type="password" name="password" required autocomplete="current-password" class="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6" />
          </div>
        </div>

        <div>
          <button type="submit" class="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Se connecter</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>

</style>