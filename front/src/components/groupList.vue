<template>
    <div class="group-list">
        <group-item
            v-for="(groupItem, i) in groupDTO.groupList"
            :group-item="groupItem"
            :key="i"
        />
    </div>
</template>

<script>
import groupItem from '@/components/groupItem.vue'

export default {
    name: 'groupList',
    components: {
        groupItem
    },
    data() {
        return {
            groupDTO: this.$store.state.groupDTO
        }
    }
}
</script>