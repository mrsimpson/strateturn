import { describe, it, expect } from 'vitest'

// TODO: Git tests require IndexedDB which is not available in Node.js test environment
// These tests should be run in browser environment or with proper IndexedDB polyfill
describe.skip('GitRepository', () => {
  it('should be tested in browser environment', () => {
    expect(true).toBe(true)
  })
})
