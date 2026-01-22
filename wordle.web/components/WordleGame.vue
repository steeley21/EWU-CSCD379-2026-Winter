<template>
  <div class="wordle-root">
    <div class="grid">
      <div v-for="r in 5" :key="r" class="row">
        <div
          v-for="c in 5"
          :key="c"
          class="cell"
          :class="cellClass(r-1, c-1)"
        >
          {{ letterAt(r-1, c-1) }}
        </div>
      </div>
    </div>

    <div class="info">
      <div v-if="gameState === 'won'" class="message">You won! Answer: {{ answer }}</div>
      <div v-else-if="gameState === 'lost'" class="message">You lost. Answer: {{ answer }}</div>
    </div>

    <div class="keyboard">
      <div class="row" v-for="row in keyboardRows" :key="row.join('')">
        <button
          v-for="key in row"
          :key="key"
          class="key"
          :class="keyClass(key)"
          @click="onKeyClick(key)">
          {{ key }}
        </button>
      </div>
      <div class="controls">
        <button class="action" @click="onEnter">Enter</button>
        <button class="action" @click="onBackspace">Back</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { WORDS } from '../data/words'

const answer = ref(WORDS[Math.floor(Math.random() * WORDS.length)])

const maxRows = 5
const cols = 5

const guesses = reactive<string[]>(Array.from({length: maxRows}, () => ''))
const statuses = reactive<string[][]>(Array.from({length: maxRows}, () => Array.from({length: cols}, () => '')))
const row = ref(0)
const gameState = ref<'playing'|'won'|'lost'>('playing')

function letterAt(r:number, c:number) {
  return (guesses[r] && guesses[r][c]) ? guesses[r][c] : ''
}

function cellClass(r:number, c:number) {
  const s = statuses[r] && statuses[r][c]
  return s ? `cell-${s}` : ''
}

function keyClass(k:string) {
  // find best status for letter across all guesses
  const upper = k.toUpperCase()
  for (let r = 0; r < maxRows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((guesses[r] && guesses[r][c]) === upper) {
        const s = statuses[r][c]
        if (s) return `key-${s}`
      }
    }
  }
  return ''
}

const keyboardRows = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
]

function onKeyClick(k:string) {
  if (gameState.value !== 'playing') return
  if (k.length === 1) addLetter(k)
}

function addLetter(letter:string) {
  const cur = guesses[row.value]
  if (cur.length >= cols) return
  guesses[row.value] = (cur + letter.toUpperCase()).slice(0, cols)
}

function onBackspace() {
  if (gameState.value !== 'playing') return
  const cur = guesses[row.value]
  guesses[row.value] = cur.slice(0, Math.max(0, cur.length - 1))
}

function onEnter() {
  if (gameState.value !== 'playing') return
  const cur = guesses[row.value]
  if (cur.length !== cols) return
  evaluateGuess(cur, row.value)
  if (gameState.value === 'playing') {
    if (row.value >= maxRows - 1) {
      gameState.value = 'lost'
    } else {
      row.value++
    }
  }
}

function evaluateGuess(guess:string, r:number) {
  const ans = answer.value
  const result = Array.from({length: cols}, () => 'absent')

  // counts of letters in answer excluding correct positions
  const counts: Record<string,number> = {}
  for (let i = 0; i < cols; i++) {
    if (guess[i] === ans[i]) continue
    const ch = ans[i]
    counts[ch] = (counts[ch] || 0) + 1
  }

  // first pass: correct
  for (let i = 0; i < cols; i++) {
    if (guess[i] === ans[i]) result[i] = 'correct'
  }

  // second pass: present or absent
  for (let i = 0; i < cols; i++) {
    if (result[i] === 'correct') continue
    const ch = guess[i]
    if (counts[ch]) {
      result[i] = 'present'
      counts[ch]--
    } else {
      result[i] = 'absent'
    }
  }

  // store statuses
  for (let i = 0; i < cols; i++) statuses[r][i] = result[i]

  // check win
  if (result.every(s => s === 'correct')) {
    gameState.value = 'won'
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (gameState.value !== 'playing') return
  const k = e.key
  if (k === 'Enter') onEnter()
  else if (k === 'Backspace') onBackspace()
  else if (/^[a-zA-Z]$/.test(k)) addLetter(k)
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.wordle-root { max-width: 480px; margin: 16px auto; font-family: system-ui, Arial; }
.grid { display:flex; flex-direction:column; gap:8px; }
.row { display:flex; gap:8px; }
.cell { width:56px; height:56px; border:2px solid #ddd; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.2rem; text-transform:uppercase; }
.cell-correct { background:#6aaa64; color:#fff; border-color:#6aaa64 }
.cell-present { background:#c9b458; color:#fff; border-color:#c9b458 }
.cell-absent { background:#787c7e; color:#fff; border-color:#787c7e }
.keyboard { margin-top:16px }
.keyboard .row { display:flex; gap:6px; justify-content:center; margin-bottom:8px }
.key { padding:8px 10px; border-radius:4px; background:#eee; border:0; min-width:36px; font-weight:600 }
.key-key-correct { background:#6aaa64; color:#fff }
.key-key-present { background:#c9b458; color:#fff }
.key-key-absent { background:#787c7e; color:#fff }
.controls { display:flex; gap:8px; justify-content:center; margin-top:8px }
.action { padding:8px 12px }
.message { margin-top:12px; text-align:center; font-weight:700 }
</style>
