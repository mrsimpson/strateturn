<template>
  <svg
    :width="size"
    :height="size"
    :class="classes"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path :d="iconPath" />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon: string
  size?: number | string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  class: ''
})

const iconPath = computed(() => props.icon)

const classes = computed(() => {
  const baseClasses = 'inline-block'
  return [baseClasses, props.class].filter(Boolean).join(' ')
})</script>
