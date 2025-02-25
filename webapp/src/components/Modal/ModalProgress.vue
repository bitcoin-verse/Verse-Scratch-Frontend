<script>
    export default {
    props: ['progress']
    };
</script>

<template>
    <div class="modal-divider">
      <div :class="['modal-progress', `p${progress}`]"></div>
    </div>
</template>