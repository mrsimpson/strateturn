<template>
  <div class="home min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-2xl mx-auto text-center">
      <div class="mb-8">
        <h1 class="text-5xl font-bold text-gray-900 mb-4">Strateturn</h1>
        <p class="text-xl text-gray-600 mb-2">
          A configurable, browser-based strategy game
        </p>
        <p class="text-lg text-gray-500">
          Play Stratego-like games with friends via P2P connection
        </p>
      </div>

      <div class="bg-white rounded-xl shadow-xl p-8 mb-8">
        <h2 class="text-2xl font-semibold mb-6">Get Started</h2>
        
        <div class="space-y-4">
          <Button 
            size="lg" 
            class="w-full"
            @click="createGame"
          >
            <Icon :icon="mdiGamepadVariant" class="mr-2" />
            Create New Game
          </Button>
          
          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-gray-200"></div>
            <span class="text-gray-500 text-sm">or</span>
            <div class="flex-1 h-px bg-gray-200"></div>
          </div>
          
          <div class="flex gap-2">
            <input
              v-model="roomCode"
              type="text"
              placeholder="Enter room code..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button 
              @click="joinGame"
              :disabled="!roomCode.trim()"
            >
              <Icon :icon="mdiLogin" class="mr-1" />
              Join Game
            </Button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div class="bg-white rounded-lg p-6 shadow-lg">
          <Icon :icon="mdiConnection" :size="32" class="text-blue-600 mb-3" />
          <h3 class="font-semibold mb-2">P2P Connection</h3>
          <p class="text-sm text-gray-600">
            Direct browser-to-browser connection using WebRTC
          </p>
        </div>
        
        <div class="bg-white rounded-lg p-6 shadow-lg">
          <Icon :icon="mdiCog" :size="32" class="text-green-600 mb-3" />
          <h3 class="font-semibold mb-2">Configurable Rules</h3>
          <p class="text-sm text-gray-600">
            YAML-based game configuration for custom themes
          </p>
        </div>
        
        <div class="bg-white rounded-lg p-6 shadow-lg">
          <Icon :icon="mdiSync" :size="32" class="text-purple-600 mb-3" />
          <h3 class="font-semibold mb-2">Git-based Sync</h3>
          <p class="text-sm text-gray-600">
            Innovative commit-per-move synchronization
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { mdiGamepadVariant, mdiLogin, mdiConnection, mdiCog, mdiSync } from '@mdi/js'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()
const roomCode = ref('')

const createGame = () => {
  // Generate a simple room ID for now
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
  router.push(`/game/${roomId}`)
}

const joinGame = () => {
  if (roomCode.value.trim()) {
    router.push(`/game/${roomCode.value.trim().toUpperCase()}`)
  }
}
</script>
