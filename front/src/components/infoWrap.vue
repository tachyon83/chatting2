<template>
    <section class="info-wrap">
        <h3 class="info-tab">
            Online
            <span class="info-user-num">{{ userCounter }}</span> <!-- DTO.length로 숫자 input -->
        </h3>
        <groupList/>
        <userProfile/>
    </section>
</template>

<script>
import userProfile from '@/components/userProfile.vue'
import groupList from '@/components/groupList.vue'

export default {
    name: 'infoWrap',
    components: {
        userProfile,
        groupList
    },
    data() {
        return {

        }
    },
    computed: {
        userCounter() {
            let groupDTO = this.$store.state.groupDTO
            let groupLength = groupDTO.groupList.length
            let usercount = 0

            for(let i = 0; i < groupLength; i++) {
                usercount += groupDTO.groupList[i].userList.length
            }
            return usercount
        }
    }
}
</script>