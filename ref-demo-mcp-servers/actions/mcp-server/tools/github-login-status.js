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

const { z } = require('zod')
const { getDeviceFlow, putToken } = require('../github-token-store.js')

// Polls GitHub's device-flow token endpoint a bounded number of times per
// call (rather than looping indefinitely) so a single tool invocation can't
// run past this action's timeout - if the user hasn't authorized yet, the
// caller just calls this tool again.
const MAX_POLL_ATTEMPTS = 6

module.exports = {
    name: 'github_login_status',
    description: 'Poll/complete a GitHub device-flow login started by github_login. Call after the user says they entered the code; if still pending, call again.',
    schema: {
        session_id: z.string().describe('session_id returned by github_login')
    },
    handler: async ({ session_id: sessionId }) => {
        const deviceFlow = await getDeviceFlow(sessionId)
        if (!deviceFlow) {
            return { content: [{ type: 'text', text: '❌ Unknown or expired session_id. Call github_login again.' }] }
        }
        if (Date.now() > deviceFlow.expires_at) {
            return { content: [{ type: 'text', text: '❌ Device code expired. Call github_login again.' }] }
        }

        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: deviceFlow.client_id,
                    device_code: deviceFlow.device_code,
                    grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
                }).toString()
            })
            const body = await response.json()

            if (body.access_token) {
                await putToken(sessionId, { access_token: body.access_token, token_type: body.token_type, scope: body.scope })
                const who = await fetch('https://api.github.com/user', {
                    headers: { Authorization: `Bearer ${body.access_token}`, Accept: 'application/vnd.github+json' }
                }).then(r => r.json()).catch(() => null)
                return {
                    content: [
                        {
                            type: 'text',
                            text: `✅ GitHub login complete${who?.login ? ` as ${who.login}` : ''}. Use session_id "${sessionId}" for github_list_repos/github_generate_repo/github_installation/github_attach.`
                        }
                    ],
                    metadata: { session_id: sessionId, login: who?.login || null }
                }
            }

            if (body.error === 'authorization_pending') {
                await new Promise(resolve => setTimeout(resolve, (deviceFlow.interval || 5) * 1000))
                continue
            }
            if (body.error === 'slow_down') {
                await new Promise(resolve => setTimeout(resolve, ((deviceFlow.interval || 5) + 5) * 1000))
                continue
            }

            return { content: [{ type: 'text', text: `❌ Device login failed: ${body.error_description || body.error}` }] }
        }

        return { content: [{ type: 'text', text: '⏳ Still waiting on user authorization. Call github_login_status again with the same session_id once you\'ve entered the code.' }] }
    }
}
