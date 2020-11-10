<template>
    <div class="info-tab user-tit user-owner">
        <span class="user-profile"></span>
        <span class="user-name">{{$store.state.userDTO.name}}</span>
    </div>
</template>

<script>
export default {
    name: 'userProfile'
}
</script>