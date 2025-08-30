<script setup lang="ts">
import { reactive, ref } from 'vue'
import useAuth from "../useAuth.ts";
import LoginForm from "./AuthComponents/LoginForm.vue";
import RegisterForm from "./AuthComponents/RegisterForm.vue";

const { authenticated, login} = useAuth()

const form = reactive({
  email: '',
  password: '',
})

const form_mode = ref('login');

function changeFormMode() {
  // exemple : alterner entre rouge et bleu
  form_mode.value = form_mode.value === "login" ? "register" : "login"
}

</script>

<template>
  <div class="min-h-screen flex flex-col justify-center items-center min-w-xl">
    <form v-if="!authenticated && form_mode == 'login'" v-on:submit.prevent="login(form)">
      <LoginForm />
      <div class="pt-5">
        <p class="text-center">{{ form_mode =='login' ? 'Pas encore inscrit ?' : 'Compte déjà créé ?'}}
          <a href="#" @click="changeFormMode">{{form_mode =='login' ? "S'inscrire maintenant" : 'Se connecter'}}</a>
        </p>
      </div>
    </form>

    <form v-else-if="!authenticated && form_mode == 'register'" v-on:submit.prevent="login(form)">
      <RegisterForm />
      <div class="pt-5">
        <p class="text-center">{{ form_mode =='login' ? 'Pas encore inscrit ?' : 'Compte déjà créé ?'}}
          <a href="#" @click="changeFormMode">{{form_mode =='login' ? "S'inscrire maintenant" : 'Se connecter'}}</a>
        </p>
      </div>
    </form>
  </div>

</template>

<style scoped>

</style>