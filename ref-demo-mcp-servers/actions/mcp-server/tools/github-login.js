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
const { newSessionId, putDeviceFlow } = require('../github-token-store.js')
const { getRequestAuth } = require('../request-context.js')

// Starts GitHub's OAuth device-authorization flow so this server owns the
// handshake itself, instead of requiring a pasted PAT or depending on the
// calling platform's own OAuth support for custom MCP servers. Device flow
// needs no redirect URI, which fits an agent-driven caller that can only
// show a link/code and poll - not host a callback endpoint.
module.exports = {
    name: 'github_login',
    description: 'Start GitHub device-flow login. Returns a verification URL and code for the user to enter at github.com/login/device, plus a session_id to pass to github_login_status and every other github_* tool.',
    schema: {
        client_id: z.string().optional().describe('GitHub OAuth App client_id. Falls back to the GITHUB_OAUTH_CLIENT_ID server config if omitted.')
    },
    handler: async ({ client_id: clientIdArg }) => {
        const clientId = clientIdArg || getRequestAuth().githubOAuthClientId
        if (!clientId) {
            return { content: [{ type: 'text', text: '❌ No GitHub OAuth client_id configured. Set GITHUB_OAUTH_CLIENT_ID on the server or pass client_id explicitly.' }] }
        }

        const response = await fetch('https://github.com/login/device/code', {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ client_id: clientId, scope: 'repo' }).toString()
        })
        const body = await response.json()
        if (!response.ok || body.error) {
            return { content: [{ type: 'text', text: `❌ Failed to start device flow: ${body.error_description || response.statusText}` }] }
        }

        const sessionId = newSessionId()
        await putDeviceFlow(sessionId, {
            client_id: clientId,
            device_code: body.device_code,
            interval: body.interval || 5,
            expires_at: Date.now() + (body.expires_in || 900) * 1000
        })

        return {
            content: [
                {
                    type: 'text',
                    text: `Open ${body.verification_uri} and enter code **${body.user_code}** to authorize GitHub access.\n\nOnce done, call github_login_status with session_id "${sessionId}" to complete the login.`
                }
            ],
            metadata: {
                session_id: sessionId,
                verification_uri: body.verification_uri,
                user_code: body.user_code,
                expires_in: body.expires_in
            }
        }
    }
}
