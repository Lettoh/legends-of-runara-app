<script setup lang="ts">
import guerrier from "@/assets/guerrier.png";
import mage from "@/assets/mage.png";
import archer from "@/assets/archer.png";

defineProps<{ character: any }>();
</script>

<template>
  <div class="character-card flex justify-center items-center">
    <img v-if="character.type_id === 1" :src="guerrier" class="h-full" />
    <img v-else-if="character.type_id === 2" :src="mage" class="h-full" />
    <img v-else-if="character.type_id === 3" :src="archer" class="h-full" />
  </div>
</template>

<style scoped>

</style>