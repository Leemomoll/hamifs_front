<template>
  <div class="eyeball" :data-max-distance="maxDistance" :style="eyeballStyle">
    <div class="eyeball-pupil" :style="pupilStyle" />
  </div>
</template>

<script setup>
const props = defineProps({
  size: { type: String, default: '48px' },
  pupilSize: { type: String, default: '16px' },
  maxDistance: { type: Number, default: 10 },
  eyeColor: { type: String, default: 'white' },
  pupilColor: { type: String, default: 'black' },
})

const eyeballStyle = {
  width: props.size,
  height: props.size,
  borderRadius: '50%',
  backgroundColor: props.eyeColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  willChange: 'height',
}

const pupilStyle = {
  width: props.pupilSize,
  height: props.pupilSize,
  borderRadius: '50%',
  backgroundColor: props.pupilColor,
  willChange: 'transform',
}
</script>
