<template>
    <section class="content-wrap">
        <roomWrap/>
    </section>
</template>

<script>
import roomWrap from '@/components/roomWrap.vue'

export default {
    name: 'contentWrap',
    components: {
        roomWrap
    },
    data() {
        return {
            showModal: this.$parent.showModal
        }
    }
}
</script>