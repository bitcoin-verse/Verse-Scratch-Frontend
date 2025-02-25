<script>
    export default {
    props: ['title'],
    methods: {
        toggleModal() {
        this.$emit('toggleModal');
        }
    }
    };
</script>

<template>
    <div class="modal-head">
      <h3 class="title">{{ title }}</h3>
      <p class="iholder">
        <i @click="toggleModal" class="close-btn"></i>
      </p>
    </div>
</template>