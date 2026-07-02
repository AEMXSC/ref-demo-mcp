/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

const { main } = require('../actions/mcp-server/index.js')

const BASE_PARAMS = { __ow_method: 'post', LOG_LEVEL: 'info' }

function mcpPost (method, params = {}) {
  return {
    ...BASE_PARAMS,
    __ow_body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  }
}

describe('MCP Server - Adobe Target', () => {

  describe('Health Check', () => {
    test('GET / returns healthy status', async () => {
      const result = await main({ __ow_method: 'get', __ow_path: '/', LOG_LEVEL: 'info' })
      expect(result.statusCode).toBe(200)
      const body = JSON.parse(result.body)
      expect(body.status).toBe('healthy')
      expect(body.server).toBe('referencedemomcp')
    })
  })

  describe('CORS', () => {
    test('OPTIONS returns CORS headers', async () => {
      const result = await main({ __ow_method: 'options', LOG_LEVEL: 'info' })
      expect(result.statusCode).toBe(200)
      expect(result.headers['Access-Control-Allow-Origin']).toBe('*')
      expect(result.headers['Access-Control-Allow-Methods']).toContain('POST')
    })
  })

  describe('MCP Protocol', () => {
    test('initialize handshake', async () => {
      const result = await main({
        ...BASE_PARAMS,
        __ow_body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'test-client', version: '1.0.0' }
          }
        })
      })
      expect(result.statusCode).toBe(200)
      const body = JSON.parse(result.body)
      expect(body.result.protocolVersion).toBe('2024-11-05')
      expect(body.result.serverInfo.name).toBe('referencedemomcp')
    })

    test('tools/list returns all 6 Adobe Target tools', async () => {
      const result = await main(mcpPost('tools/list'))
      expect(result.statusCode).toBe(200)
      const body = JSON.parse(result.body)
      const names = body.result.tools.map(t => t.name)
      expect(names).toEqual(expect.arrayContaining([
        'list_audiences',
        'create_audience',
        'create_xt_activity',
        'update_activity_state',
        'get_atjs',
        'upload_atjs_to_github'
      ]))
      expect(names).toHaveLength(6)
    })

    test('tools/list — each tool has a name, description, and inputSchema', async () => {
      const result = await main(mcpPost('tools/list'))
      const body = JSON.parse(result.body)
      for (const tool of body.result.tools) {
        expect(typeof tool.name).toBe('string')
        expect(typeof tool.description).toBe('string')
        expect(tool.inputSchema).toBeDefined()
      }
    })
  })

  describe('Error Handling', () => {
    test('invalid JSON returns 500 with JSON-RPC error', async () => {
      const result = await main({ ...BASE_PARAMS, __ow_body: 'not json' })
      expect(result.statusCode).toBe(500)
      const body = JSON.parse(result.body)
      expect(body.error).toBeDefined()
    })

    test('unknown tool call returns isError result', async () => {
      const result = await main(mcpPost('tools/call', { name: 'nonexistent_tool', arguments: {} }))
      expect(result.statusCode).toBe(200)
      const body = JSON.parse(result.body)
      expect(body.result.isError).toBe(true)
      expect(body.result.content[0].text).toContain('-32602')
    })

    test('unsupported HTTP method returns 405', async () => {
      const result = await main({ __ow_method: 'put', LOG_LEVEL: 'info' })
      expect(result.statusCode).toBe(405)
    })
  })
})
