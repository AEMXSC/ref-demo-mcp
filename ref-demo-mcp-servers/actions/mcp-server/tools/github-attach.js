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

// OAuth-token equivalent of gh-site's `attach` subcommand.
module.exports = {
    name: 'github_attach',
    description: 'Attach a repo to an existing aem-code-sync GitHub App installation, using a session_id from github_login.',
    schema: {
        session_id: z.string().describe('session_id from github_login'),
        installation_id: z.string().describe('Installation id from github_installation'),
        owner: z.string().describe('Repo owner (org or user)'),
        repo: z.string().describe('Repo name')
    },
    handler: async ({ session_id: sessionId, installation_id: installationId, owner, repo }) => {
        const repoResult = await githubRequest(sessionId, 'GET', `/repos/${owner}/${repo}`)
        if (repoResult.error) return { content: [{ type: 'text', text: `❌ ${repoResult.error}` }] }
        if (repoResult.status !== 200) return { content: [{ type: 'text', text: `❌ repo ${owner}/${repo} not found (${repoResult.status})` }] }

        const attachResult = await githubRequest(sessionId, 'PUT', `/user/installations/${installationId}/repositories/${repoResult.body.id}`)
        if ([204, 304].includes(attachResult.status)) {
            return { content: [{ type: 'text', text: '✅ ATTACHED' }] }
        }
        return { content: [{ type: 'text', text: `❌ attach -> ${attachResult.status}` }] }
    }
}
