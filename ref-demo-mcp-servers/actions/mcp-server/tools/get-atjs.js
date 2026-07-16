/*
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const ENDPOINT_LOOKUP_BASE = 'https://admin.testandtarget.omniture.com/rest/v1/endpoint'
const IMS_TOKEN_URL = 'https://ims-na1.adobelogin.com/ims/token/v3'
const TARGET_SCOPES = [
    'openid', 'AdobeID', 'read_organizations',
    'additional_info.projectedProductContext', 'additional_info.roles',
    'adobeio_api', 'read_pc.dma_bullseye'
].join(',')

const tokenCache = { token: null, expiresAt: 0 }

async function getAccessToken (params) {
    if (params.ADOBE_ACCESS_TOKEN) return params.ADOBE_ACCESS_TOKEN
    if (tokenCache.token && Date.now() < tokenCache.expiresAt) return tokenCache.token

    const res = await fetch(IMS_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: params.ADOBE_CLIENT_ID,
            client_secret: params.ADOBE_CLIENT_SECRET,
            scope: TARGET_SCOPES
        }).toString()
    })
    if (!res.ok) throw new Error(`IMS token fetch failed: ${res.status} ${await res.text()}`)
    const data = await res.json()
    let expiresIn = data.expires_in || 86400
    if (expiresIn > 1_000_000) expiresIn = expiresIn / 1000
    tokenCache.token = data.access_token
    tokenCache.expiresAt = Date.now() + (expiresIn - 300) * 1000
    return tokenCache.token
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

module.exports = {
    name: 'get_atjs',
    description: 'Fetch the at.js library from Adobe Target and return its content.',
    schema: {},
    handler: async (_args, params) => {
        const res = await fetchAtjs(params)
        const content = await res.text()
        return { content: [{ type: 'text', text: content }] }
    }
}
