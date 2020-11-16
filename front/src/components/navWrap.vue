<template>
    <nav class="nav-wrap">
        <menuList/>
    </nav>
</template>

<script>
import menuList from '@/components/menuList.vue'

export default {
    name: 'navWrap',
    components: {
        menuList
    }
}
</script>