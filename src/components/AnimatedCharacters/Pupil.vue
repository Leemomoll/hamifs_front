<template>
  <div :data-max-distance="maxDistance" class="pupil" :style="pupilStyle" />
</template>

<script setup>
const props = defineProps({
  size: { type: String, default: '12px' },
  maxDistance: { type: Number, default: 5 },
  pupilColor: { type: String, default: 'black' },
})

const pupilStyle = {
  width: props.size,
  height: props.size,
  borderRadius: '50%',
  backgroundColor: props.pupilColor,
  willChange: 'transform',
}
</script>
