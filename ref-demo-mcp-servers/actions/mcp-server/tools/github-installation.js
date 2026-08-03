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
const { githubRequest } = require('../github-api.js')

// OAuth-token equivalent of gh-site's `installation` subcommand.
module.exports = {
    name: 'github_installation',
    description: 'Find the aem-code-sync GitHub App installation id for the logged-in user, using a session_id from github_login.',
    schema: {
        session_id: z.string().describe('session_id from github_login')
    },
    handler: async ({ session_id: sessionId }) => {
        const result = await githubRequest(sessionId, 'GET', '/user/installations?per_page=100')
        if (result.error) return { content: [{ type: 'text', text: `❌ ${result.error}` }] }
        if (result.status !== 200) {
            return { content: [{ type: 'text', text: `❌ GET /user/installations -> ${result.status} (needs a login that can see installations)` }] }
        }

        const installation = (result.body.installations || []).find(i => i.app_slug === 'aem-code-sync')
        return {
            content: [{ type: 'text', text: installation ? String(installation.id) : 'NOT_INSTALLED' }],
            metadata: { installation_id: installation?.id || null }
        }
    }
}
