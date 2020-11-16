<template>
    <li class="user-item user-owner">
        <a href="#">
            <span class="user-profile"></span>
            <span class="user-name">{{user.name}}</span>
        </a>
    </li>
</template>

<script>
export default {
    name: 'userItem',
    data() {
        return {
            user: this.$parent.userList
        }
    }
}
</script>