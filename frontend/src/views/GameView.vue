<template>
  <div class="game-view min-h-screen bg-gray-100 p-4">
    <div class="max-w-6xl mx-auto">
      <header class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Strateturn</h1>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div 
              :class="[
                'w-3 h-3 rounded-full',
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              ]"
            />
            <span class="text-sm text-gray-600">
              {{ connectionStatusText }}
            </span>
          </div>
          <Button 
            v-if="connectionStatus === 'disconnected'"
            @click="connectToGame"
            size="sm"
          >
            <Icon :icon="mdiConnection" class="mr-1" />
            Connect to Game
          </Button>
        </div>
      </header>

      <main class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Game Board -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h2 class="text-xl font-semibold mb-4">Game Board</h2>
            <div class="aspect-square bg-green-100 rounded-lg flex items-center justify-center">
              <div class="text-center text-gray-500">
                <Icon :icon="mdiChessboard" :size="64" class="mx-auto mb-4 text-green-600" />
                <p>Game board will be rendered here</p>
                <p class="text-sm mt-2">10x10 Stratego board coming soon...</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Game Info Sidebar -->
        <div class="space-y-4">
          <!-- Current Turn -->
          <div class="bg-white rounded-lg shadow-lg p-4">
            <h3 class="font-semibold mb-2 flex items-center">
              <Icon :icon="mdiAccountClock" class="mr-2" />
              Current Turn
            </h3>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Red Player</span>
            </div>
          </div>

          <!-- Game Status -->
          <div class="bg-white rounded-lg shadow-lg p-4">
            <h3 class="font-semibold mb-2 flex items-center">
              <Icon :icon="mdiInformation" class="mr-2" />
              Game Status
            </h3>
            <p class="text-sm text-gray-600">Setup Phase</p>
            <p class="text-xs text-gray-500 mt-1">Place your pieces to start</p>
          </div>

          <!-- Captured Pieces -->
          <div class="bg-white rounded-lg shadow-lg p-4">
            <h3 class="font-semibold mb-2 flex items-center">
              <Icon :icon="mdiTrophy" class="mr-2" />
              Captured Pieces
            </h3>
            <div class="space-y-2">
              <div>
                <p class="text-sm font-medium text-red-600">Red: 0</p>
              </div>
              <div>
                <p class="text-sm font-medium text-blue-600">Blue: 0</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-white rounded-lg shadow-lg p-4">
            <h3 class="font-semibold mb-2 flex items-center">
              <Icon :icon="mdiCog" class="mr-2" />
              Actions
            </h3>
            <div class="space-y-2">
              <Button 
                variant="secondary" 
                size="sm" 
                class="w-full"
                @click="resetGame"
              >
                <Icon :icon="mdiRestart" class="mr-1" />
                Reset Game
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                class="w-full"
                @click="surrenderGame"
              >
                <Icon :icon="mdiFlag" class="mr-1" />
                Surrender
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  mdiConnection, 
  mdiChessboard, 
  mdiAccountClock, 
  mdiInformation, 
  mdiTrophy, 
  mdiCog, 
  mdiRestart, 
  mdiFlag 
} from '@mdi/js'
import Button from '@/components/ui/Button.vue'
import Icon from '@/components/ui/Icon.vue'

// Connection state
const connectionStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case 'connected': return 'Connected to peer'
    case 'connecting': return 'Connecting...'
    case 'disconnected': return 'Not connected'
  }
})

// Actions
const connectToGame = () => {
  connectionStatus.value = 'connecting'
  
  // Simulate connection process
  setTimeout(() => {
    connectionStatus.value = 'connected'
  }, 2000)
}

const resetGame = () => {
  console.log('Reset game clicked')
  // TODO: Implement game reset logic
}

const surrenderGame = () => {
  console.log('Surrender game clicked')
  // TODO: Implement surrender logic
}</script>
