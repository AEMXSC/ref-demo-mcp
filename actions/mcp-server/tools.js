/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
*/

const { z } = require('zod')

const TARGET_API_BASE = 'https://mc.adobe.io'
const ENDPOINT_LOOKUP_BASE = 'https://admin.testandtarget.omniture.com/rest/v1/endpoint'
const GITHUB_API_BASE = 'https://api.github.com'
const IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3'
const TARGET_SCOPES = [
  'openid', 'AdobeID', 'read_organizations',
  'additional_info.projectedProductContext', 'additional_info.roles',
  'adobeio_api', 'read_pc.dma_bullseye'
].join(',')
const AEM_SCOPES = [
  'openid', 'AdobeID', 'target_sdk', 'additional_info.projectedProductContext',
  'read_organizations', 'additional_info.roles', 'contentai.api',
  'aem.fragments.management', 'aem.folders'
].join(',')

const tokenCache = {}

async function getAccessToken (params, scope = TARGET_SCOPES) {
  if (params.ADOBE_ACCESS_TOKEN) return params.ADOBE_ACCESS_TOKEN

  const cached = tokenCache[scope]
  if (cached && Date.now() < cached.expiresAt) return cached.token

  const res = await fetch(IMS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: params.ADOBE_CLIENT_ID,
      client_secret: params.ADOBE_CLIENT_SECRET,
      scope
    }).toString()
  })
  if (!res.ok) throw new Error(`IMS token fetch failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  let expiresIn = data.expires_in || 86400
  if (expiresIn > 1_000_000) expiresIn = expiresIn / 1000
  tokenCache[scope] = {
    token: data.access_token,
    expiresAt: Date.now() + (expiresIn - 300) * 1000
  }
  return tokenCache[scope].token
}

function targetHeaders (token, apiKey, version = 'v3') {
  return {
    'Authorization': `Bearer ${token}`,
    'X-Api-Key': apiKey,
    'Content-Type': `application/vnd.adobe.target.${version}+json`,
    'Accept': `application/vnd.adobe.target.${version}+json`
  }
}

function text (obj) {
  return { content: [{ type: 'text', text: typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2) }] }
}

async function parseResponse (res) {
  const ct = res.headers.get('content-type') || ''
  const body = ct.includes('json') || ct.includes('adobe.target') ? await res.json() : await res.text()
  return { status_code: res.status, success: res.ok, response: body }
}

async function fetchAtjs (params) {
  const token = await getAccessToken(params)
  const tenant = params.ADOBE_ATJS_TENANT
  const apiKey = params.ADOBE_API_KEY
  const headers = { 'Authorization': `Bearer ${token}`, 'X-Api-Key': apiKey }

  const lookupRes = await fetch(`${ENDPOINT_LOOKUP_BASE}/${tenant}`, { headers })
  if (!lookupRes.ok) throw new Error(`Endpoint lookup failed: ${lookupRes.status}`)
  const { api: apiBase } = await lookupRes.json()

  const downloadRes = await fetch(`${apiBase}/libraries/atjs/download?client=${tenant}`, { headers })
  if (!downloadRes.ok) throw new Error(`at.js download failed: ${downloadRes.status}`)
  return downloadRes
}

/**
 * Register all Adobe Target tools with the MCP server.
 * @param {McpServer} server
 * @param {object} params - Adobe I/O Runtime action params (env vars injected here)
 */
function registerTools (server, params) {

  server.tool(
    'list_audiences',
    'List audiences in Adobe Target using the Admin API.',
    {
      limit: z.number().int().optional().describe('Max audiences to return'),
      offset: z.number().int().optional().describe('Pagination offset'),
      sort_by: z.string().optional().describe('Field to sort by (e.g. "id", "name", "modifiedAt")')
    },
    async ({ limit, offset, sort_by }) => {
      const token = await getAccessToken(params)
      const tenant = params.ADOBE_TARGET_TENANT
      const url = new URL(`${TARGET_API_BASE}/${tenant}/target/audiences`)
      if (limit != null) url.searchParams.set('limit', limit)
      if (offset != null) url.searchParams.set('offset', offset)
      if (sort_by) url.searchParams.set('sortBy', sort_by)

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Api-Key': params.ADOBE_API_KEY,
          'Accept': 'application/vnd.adobe.target.v3+json'
        }
      })
      return text(await parseResponse(res))
    }
  )

  server.tool(
    'create_audience',
    'Create an audience in Adobe Target.',
    {
      name: z.string().describe('Audience name'),
      description: z.string().optional().describe('Audience description'),
      target_rule: z.record(z.any()).optional().describe('Targeting rule JSON object with "and"/"or" conjunctions'),
      workspace: z.string().optional().describe('Workspace ID')
    },
    async ({ name, description, target_rule, workspace }) => {
      const token = await getAccessToken(params)
      const tenant = params.ADOBE_TARGET_TENANT
      const body = { name }
      if (description) body.description = description
      if (target_rule) body.targetRule = target_rule
      if (workspace) body.workspace = workspace

      const res = await fetch(`${TARGET_API_BASE}/${tenant}/target/audiences`, {
        method: 'POST',
        headers: targetHeaders(token, params.ADOBE_API_KEY),
        body: JSON.stringify(body)
      })
      return text(await parseResponse(res))
    }
  )

  server.tool(
    'create_xt_activity',
    'Create an Experience Targeting (XT) activity in Adobe Target.',
    {
      name: z.string().describe('Activity name (max 250 chars)'),
      audience_id: z.number().int().describe('Audience ID to target'),
      offer_id: z.number().int().describe('Offer ID to display'),
      mbox_name: z.string().default('target-global-mbox').describe('Mbox/location name'),
      conversion_mbox: z.string().optional().describe('Mbox for conversion goal. Defaults to mbox_name'),
      state: z.enum(['inactive', 'active', 'approved']).default('inactive').describe('Activity state'),
      priority: z.number().int().min(0).max(999).default(0).describe('Priority 0–999'),
      starts_at: z.string().optional().describe('Start datetime "YYYY-MM-DD hh:mm:ss.0 UTC"'),
      ends_at: z.string().optional().describe('End datetime "YYYY-MM-DD hh:mm:ss.0 UTC"')
    },
    async ({ name, audience_id, offer_id, mbox_name, conversion_mbox, state, priority, starts_at, ends_at }) => {
      const token = await getAccessToken(params)
      const tenant = params.ADOBE_TARGET_TENANT
      const body = {
        name, state, priority,
        options: [{ optionLocalId: 0, offerId: offer_id }],
        locations: { mboxes: [{ locationLocalId: 0, name: mbox_name }] },
        experiences: [{
          experienceLocalId: 0,
          name: 'Experience A',
          audienceIds: [audience_id],
          optionLocations: [{ locationLocalId: 0, optionLocalId: 0 }]
        }],
        metrics: [{
          metricLocalId: 32767,
          name: 'Primary Goal',
          conversion: true,
          action: { type: 'count_once' },
          mboxes: [{ name: conversion_mbox || mbox_name, successEvent: 'mbox_shown' }]
        }]
      }
      if (starts_at) body.startsAt = starts_at
      if (ends_at) body.endsAt = ends_at

      const res = await fetch(`${TARGET_API_BASE}/${tenant}/target/activities/xt`, {
        method: 'POST',
        headers: targetHeaders(token, params.ADOBE_API_KEY),
        body: JSON.stringify(body)
      })
      return text(await parseResponse(res))
    }
  )

  server.tool(
    'update_activity_state',
    'Update the state of an Adobe Target activity (e.g. approve/activate it).',
    {
      activity_id: z.number().int().describe('Activity ID to update'),
      state: z.enum(['approved', 'inactive', 'deactivated']).default('approved').describe('New activity state')
    },
    async ({ activity_id, state }) => {
      const token = await getAccessToken(params)
      const tenant = params.ADOBE_TARGET_TENANT

      const res = await fetch(`${TARGET_API_BASE}/${tenant}/target/activities/${activity_id}/state`, {
        method: 'PUT',
        headers: targetHeaders(token, params.ADOBE_API_KEY, 'v1'),
        body: JSON.stringify({ state })
      })
      return text(await parseResponse(res))
    }
  )

  server.tool(
    'get_atjs',
    'Fetch the at.js library from Adobe Target and return its content.',
    {},
    async () => {
      const res = await fetchAtjs(params)
      const content = await res.text()
      return text(content)
    }
  )

  server.tool(
    'export_cf_to_target',
    'Export one or more AEM Content Fragments to Adobe Target as offers. Calls the AEM author ' +
    '.cfm.targetexport endpoint for each set of paths, returning the Target offer ID assigned to ' +
    'each fragment, or an error message if the export failed for a given path.',
    {
      author_url: z.string().describe('Base URL of the AEM author instance, e.g. "https://author-p153659-e1620914.adobeaemcloud.com"'),
      paths: z.array(z.string()).describe('List of DAM paths to export, e.g. ["/content/dam/wknd-ref/en/fragments/promotions/fragment-one"]'),
      token: z.string().optional().describe('IMS Bearer token (without the "Bearer " prefix). Defaults to the server\'s configured Adobe IMS credentials if omitted.')
    },
    async ({ author_url, paths, token }) => {
      if (!paths || paths.length === 0) {
        return text('Error: paths list is empty — provide at least one DAM path.')
      }

      token = token || await getAccessToken(params, AEM_SCOPES)

      // The export endpoint is appended to the first path in the list.
      // AEM uses this URL as the "primary" resource; all paths are passed as form params.
      const endpoint = `${author_url.replace(/\/+$/, '')}${paths[0]}.cfm.targetexport`

      const body = new URLSearchParams()
      for (const p of paths) body.append('paths', p)
      body.append('action', 'export')

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: body.toString()
        })
        const responseText = await res.text()
        if (!res.ok) {
          return text(`HTTP ${res.status} from AEM: ${responseText.slice(0, 500)}`)
        }
        return text(responseText)
      } catch (e) {
        return text(`Request failed: ${e.message}`)
      }
    }
  )

  server.tool(
    'upload_atjs_to_github',
    'Fetch at.js from Adobe Target and upload it to a GitHub repository.',
    {
      branch: z.string().default('main').describe('Target branch'),
      commit_message: z.string().default('chore: update at.js').describe('Commit message')
    },
    async ({ branch, commit_message }) => {
      const atjsRes = await fetchAtjs(params)
      const atjsBuffer = await atjsRes.arrayBuffer()
      const encoded = Buffer.from(atjsBuffer).toString('base64')

      const owner = params.GITHUB_REPO_OWNER
      const repo = params.GITHUB_REPO_NAME
      const filePath = params.GITHUB_FILE_PATH
      const ghToken = params.GITHUB_TOKEN

      const ghHeaders = {
        'Authorization': `Bearer ${ghToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      }
      const contentsUrl = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}`

      const existingRes = await fetch(`${contentsUrl}?ref=${branch}`, { headers: ghHeaders })
      const sha = existingRes.ok ? (await existingRes.json()).sha : undefined

      const body = { message: commit_message, content: encoded, branch }
      if (sha) body.sha = sha

      const uploadRes = await fetch(contentsUrl, {
        method: 'PUT',
        headers: ghHeaders,
        body: JSON.stringify(body)
      })
      if (!uploadRes.ok) throw new Error(`GitHub upload failed: ${uploadRes.status} ${await uploadRes.text()}`)

      const data = await uploadRes.json()
      return text({
        success: true,
        action: sha ? 'updated' : 'created',
        commit_sha: data.commit.sha,
        file_url: data.content.html_url
      })
    }
  )
}

function registerResources (server) {}
function registerPrompts (server) {}

module.exports = { registerTools, registerResources, registerPrompts }
