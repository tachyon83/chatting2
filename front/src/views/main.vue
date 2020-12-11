<template>
  <div class="app-wrap">
    <navWrap/>
    <router-view>
    </router-view>
  </div>
</template>

<script>
import navWrap from "@/components/navWrap.vue";

export default {
  name: 'main',
  components: {
    navWrap,
  }
}
</script>
