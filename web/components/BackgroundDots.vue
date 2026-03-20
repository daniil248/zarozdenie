<template>
  <div class="background-dots" aria-hidden="true">
    <canvas ref="canvasEl" class="background-dots__canvas" />
  </div>
</template>

<script setup lang="ts">
// Сетка интерактивных точек: одинаково на десктопе и мобильных (Android, iOS, Safari). Стабильные позиции, touch + mouse.
const props = withDefaults(defineProps<{ bright?: boolean }>(), { bright: false })
const canvasEl = ref<HTMLCanvasElement | null>(null)

const PARTICLE_OPACITY = computed(() => (props.bright ? 0.62 : 0.4))
const LINE_OPACITY_BASE = computed(() => (props.bright ? 0.26 : 0.15))
const MOUSE_LINE_OPACITY_BASE = computed(() => (props.bright ? 0.48 : 0.3))
const CONNECT_DISTANCE = 120
const MOUSE_DISTANCE = 150
const PARTICLE_COUNT = 187
const RESIZE_DEBOUNCE_MS = 200
const MIN_SIZE_CHANGE = 20
const BASE_SPEED = 0.75

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

let particles: Particle[] = []
let mouse = { x: null as number | null, y: null as number | null }
let rafId = 0
let lastW = 0
let lastH = 0
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let lastFrameTime = 0

function getCanvasSize(canvas: HTMLCanvasElement): { w: number; h: number } {
  const parent = canvas.parentElement
  if (parent) return { w: parent.offsetWidth, h: parent.offsetHeight }
  if (typeof window === 'undefined') return { w: 0, h: 0 }
  return { w: window.innerWidth, h: window.innerHeight }
}

function resize(canvas: HTMLCanvasElement) {
  const { w, h } = getCanvasSize(canvas)
  if (w <= 0 || h <= 0) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
  }
  lastW = w
  lastH = h
}

function initParticlesOnce(w: number, h: number) {
  if (particles.length > 0) return
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * BASE_SPEED,
      vy: (Math.random() - 0.5) * BASE_SPEED,
      radius: 2.5
    })
  }
}

function scaleParticlesOnResize(newW: number, newH: number) {
  if (particles.length === 0 || lastW <= 0 || lastH <= 0) return
  const scaleX = newW / lastW
  const scaleY = newH / lastH
  particles.forEach((p) => {
    p.x = Math.max(0, Math.min(newW, p.x * scaleX))
    p.y = Math.max(0, Math.min(newH, p.y * scaleY))
  })
}

function animate(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const now = performance.now()
  const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 16.67, 2) : 1
  lastFrameTime = now
  const w = lastW || canvas.offsetWidth || 1
  const h = lastH || canvas.offsetHeight || 1
  ctx.clearRect(0, 0, w, h)

  const particleOpacity = PARTICLE_OPACITY.value
  const lineBase = LINE_OPACITY_BASE.value
  const mouseLineBase = MOUSE_LINE_OPACITY_BASE.value

  particles.forEach((p) => {
    p.x += p.vx * dt
    p.y += p.vy * dt
    if (p.x < 0 || p.x > w) p.vx *= -1
    if (p.y < 0 || p.y > h) p.vy *= -1
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(168, 88, 236, ${particleOpacity})`
    ctx.fill()
  })

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < CONNECT_DISTANCE) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.strokeStyle = `rgba(168, 88, 236, ${lineBase * (1 - distance / CONNECT_DISTANCE)})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
    if (mouse.x != null && mouse.y != null) {
      const dx = particles[i].x - mouse.x
      const dy = particles[i].y - mouse.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < MOUSE_DISTANCE) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(mouse.x, mouse.y)
        ctx.strokeStyle = `rgba(168, 88, 236, ${mouseLineBase * (1 - distance / MOUSE_DISTANCE)})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }
  }

  rafId = requestAnimationFrame(() => animate(canvas))
}

let cleanupResize: (() => void) | null = null
let cleanupMouse: (() => void) | null = null

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  resize(canvas)
  initParticlesOnce(lastW, lastH)

  const applyResize = () => {
    const { w, h } = getCanvasSize(canvas)
    if (w <= 0 || h <= 0) return
    const dw = Math.abs(w - lastW)
    // In mobile Safari, address-bar show/hide changes only height and causes visual jumps.
    // Scale particles only on meaningful width changes (or full orientation/resize change).
    const shouldScale = dw >= MIN_SIZE_CHANGE
    if (particles.length > 0 && lastW > 0 && lastH > 0 && shouldScale) {
      scaleParticlesOnResize(w, h)
    } else if (particles.length > 0) {
      particles.forEach((p) => {
        p.x = Math.max(0, Math.min(w, p.x))
        p.y = Math.max(0, Math.min(h, p.y))
      })
    }
    resize(canvas)
    if (particles.length === 0) initParticlesOnce(lastW, lastH)
  }

  const onResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      applyResize()
      resizeTimer = null
    }, RESIZE_DEBOUNCE_MS)
  }

  const onMouseMove = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect()
    mouse.x = e.clientX - r.left
    mouse.y = e.clientY - r.top
  }
  const onMouseLeave = () => {
    mouse.x = null
    mouse.y = null
  }
  const onTouchMove = (e: TouchEvent) => {
    if (!e.touches[0]) return
    const r = canvas.getBoundingClientRect()
    mouse.x = e.touches[0].clientX - r.left
    mouse.y = e.touches[0].clientY - r.top
  }
  const onTouchEnd = () => {
    mouse.x = null
    mouse.y = null
  }

  canvas.addEventListener('mousemove', onMouseMove, { passive: true })
  canvas.addEventListener('mouseleave', onMouseLeave)
  canvas.addEventListener('touchmove', onTouchMove, { passive: true })
  canvas.addEventListener('touchend', onTouchEnd, { passive: true })
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: true })
  window.addEventListener('resize', onResize)
  window.addEventListener('orientationchange', onResize)

  cleanupResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('orientationchange', onResize)
  }
  cleanupMouse = () => {
    canvas.removeEventListener('mousemove', onMouseMove)
    canvas.removeEventListener('mouseleave', onMouseLeave)
    canvas.removeEventListener('touchmove', onTouchMove)
    canvas.removeEventListener('touchend', onTouchEnd)
    canvas.removeEventListener('touchcancel', onTouchEnd)
  }
  animate(canvas)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  cleanupResize?.()
  cleanupMouse?.()
})
</script>

<style scoped>
.background-dots {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: auto;
}
.background-dots__canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>
