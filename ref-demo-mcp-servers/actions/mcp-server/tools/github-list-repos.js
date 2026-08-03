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

// OAuth-token equivalent of gh-site's `list-repos` subcommand.
module.exports = {
    name: 'github_list_repos',
    description: 'List repos for a GitHub owner (org or user), using a session_id from github_login.',
    schema: {
        session_id: z.string().describe('session_id from github_login'),
        owner: z.string().describe('GitHub org or user login (GITHUB_OWNER)')
    },
    handler: async ({ session_id: sessionId, owner }) => {
        const orgsResult = await githubRequest(sessionId, 'GET', '/user/orgs?per_page=100')
        if (orgsResult.error) return { content: [{ type: 'text', text: `❌ ${orgsResult.error}` }] }
        if (orgsResult.status !== 200) return { content: [{ type: 'text', text: `❌ GET /user/orgs -> ${orgsResult.status}` }] }

        const isOrg = Array.isArray(orgsResult.body) && orgsResult.body.some(o => o.login === owner)
        const listResult = await githubRequest(
            sessionId,
            'GET',
            isOrg ? `/orgs/${owner}/repos?per_page=100&type=all` : '/user/repos?per_page=100&affiliation=owner'
        )
        if (listResult.status !== 200) return { content: [{ type: 'text', text: `❌ list repos -> ${listResult.status}` }] }

        const repos = listResult.body.map(r => r.full_name)
        return {
            content: [{ type: 'text', text: repos.join('\n') || '(no repos found)' }],
            metadata: { repos }
        }
    }
}
