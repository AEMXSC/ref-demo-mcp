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

// Thin GitHub REST client shared by the github_* tools. Looks up the
// session's OAuth token (from github-token-store.js) instead of reading a
// PAT from .env - the classic-PAT path stays in the local gh-site script as
// a separate fallback.

const { getToken } = require('./github-token-store.js')

const API = 'https://api.github.com'

async function githubRequest (sessionId, method, path, body) {
    const token = await getToken(sessionId)
    if (!token?.access_token) {
        return { error: `No GitHub login found for session_id "${sessionId}". Call github_login (then github_login_status) first.` }
    }

    const url = path.startsWith('http') ? path : `${API}${path}`
    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${token.access_token}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    })

    const text = await response.text()
    let json = null
    try {
        json = text ? JSON.parse(text) : null
    } catch (_) {
        json = text
    }
    return { status: response.status, body: json }
}

module.exports = { githubRequest }
