import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextLevel } from './level.js'

void test('set uses the absolute percent, clamped', () => {
  assert.equal(nextLevel(0.2, 'set', 80, 5), 0.8)
  assert.equal(nextLevel(0.2, 'set', 150, 5), 1)
  assert.equal(nextLevel(0.2, 'set', -10, 5), 0)
})

void test('up and down nudge from the current level by step', () => {
  assert.equal(nextLevel(0.5, 'up', 80, 10), 0.6)
  assert.equal(nextLevel(0.5, 'down', 80, 10), 0.4)
})

void test('nudges clamp to 0..1', () => {
  assert.equal(nextLevel(0.97, 'up', 80, 5), 1)
  assert.equal(nextLevel(0.02, 'down', 80, 5), 0)
})
