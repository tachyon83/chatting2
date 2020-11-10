<template>
    <div class="modal-bnt-wrap">
        <button 
            @click.prevent="$parent.createRoom"
            class="btn-basic bg-purple"
        >CREATE</button>
        <button 
            @click.prevent="$parent.resetNewRoomModal"
            class="btn-basic bg-grey"
        >CANCEL</button>
    </div>
</template>

<script>
export default {
    name: 'modalBtnWrap'
}
</script>