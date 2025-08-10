import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { app, server } from '../index.js'

describe('Strateturn Backend Server', () => {
  beforeAll(() => {
    // Server setup is handled in index.ts
  })

  afterAll(() => {
    server.close()
  })

  it('should respond to health check', async () => {
    const response = await fetch('http://localhost:3001/health')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.service).toBe('strateturn-backend')
    expect(data.timestamp).toBeDefined()
  })

  it('should handle CORS headers', async () => {
    const response = await fetch('http://localhost:3001/health')
    
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
