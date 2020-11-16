<template>
    <p class="modal-alert">
        {{ modalAlertMsg }}
    </p>
</template>

<script>
export default {
    name: 'modalAlert',
    data() {
        return {
            modalAlertMsg: '방 제목을 입력해주세요'
        }
    }
}
</script>

<style lang="scss" scoped>

</style>