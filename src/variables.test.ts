import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Project } from '@visibox/api-client'
import { SLOT_COUNT, slotNames } from './variables.js'

const project = {
  songOrder: ['s1', 's2'],
  songs: {
    s1: { title: 'Opener', clipOrder: ['c1', 'c2'] },
    s2: { title: 'Closer', clipOrder: ['c3'] },
  },
  clips: {
    c1: { title: 'Intro' },
    c2: { title: 'Drop' },
    c3: { title: 'Outro' },
  },
} as unknown as Project

void test('songs come from project order, clips from the active song', () => {
  const names = slotNames(project, 's1')
  assert.equal(names.song_1_name, 'Opener')
  assert.equal(names.song_2_name, 'Closer')
  assert.equal(names.clip_1_name, 'Intro')
  assert.equal(names.clip_2_name, 'Drop')
})

void test('clip slots follow the active song', () => {
  assert.equal(slotNames(project, 's2').clip_1_name, 'Outro')
  assert.equal(slotNames(project, 's2').clip_2_name, '')
})

void test('every slot is defined, empty past the end or with no project', () => {
  for (const names of [slotNames(project, 's1'), slotNames(null, null)]) {
    assert.equal(Object.keys(names).length, SLOT_COUNT * 2)
    assert.equal(names[`song_${SLOT_COUNT}_name`], '')
    assert.equal(names[`clip_${SLOT_COUNT}_name`], '')
  }
})
