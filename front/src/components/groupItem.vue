<template>
    <div>
        <h4 class="group-tit" :class="{off : !active}">
            <a href="#" @click.prevent="toggleGroup">{{ groupItem.name }}</a>
        </h4>
        <ul class="user-list" v-show="active">
            <li 
             v-for="(userItem, i) in groupItem.userList" 
             :key="i"
             class="user-item user-owner"
             :class="userItem"
            >
                <a href="#">
                    <span class="user-profile"></span>
                    <span class="user-name">{{ userItem.name }}</span>
                </a>
            </li>
        </ul>
    </div>
</template>

<script>
// import userItem from '@/components/userItem.vue'

export default {
    name: 'groupItem',
    props: {
	  groupItem: Object
    },
    components: {
        // userItem
    },
    data() {
         return {
             active: false,
             userList : this.$store.state.groupUserDTO
         }
     },
     methods: {
         toggleGroup() {
             this.active = !this.active
         }
     }
}
</script>