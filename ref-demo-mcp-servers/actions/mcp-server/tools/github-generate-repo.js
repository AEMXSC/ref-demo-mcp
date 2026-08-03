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

// OAuth-token equivalent of gh-site's `generate` subcommand.
module.exports = {
    name: 'github_generate_repo',
    description: 'Create a new repo from a GitHub template repo, using a session_id from github_login.',
    schema: {
        session_id: z.string().describe('session_id from github_login'),
        template_owner: z.string().describe('Owner of the template repo'),
        template_repo: z.string().describe('Name of the template repo'),
        new_repo: z.string().describe('Name for the new repo'),
        owner: z.string().describe('Owner (org or user) to create the new repo under')
    },
    handler: async ({ session_id: sessionId, template_owner: templateOwner, template_repo: templateRepo, new_repo: newRepo, owner }) => {
        const result = await githubRequest(sessionId, 'POST', `/repos/${templateOwner}/${templateRepo}/generate`, {
            owner,
            name: newRepo,
            private: true,
            include_all_branches: false
        })
        if (result.error) return { content: [{ type: 'text', text: `❌ ${result.error}` }] }

        if (result.status === 201) {
            return { content: [{ type: 'text', text: `✅ Created ${result.body.full_name}` }], metadata: { full_name: result.body.full_name } }
        }
        if (result.status === 422) {
            return { content: [{ type: 'text', text: `❌ generate -> 422 (repo '${newRepo}' may already exist, or '${templateOwner}/${templateRepo}' is not a template repo)` }] }
        }
        return { content: [{ type: 'text', text: `❌ generate -> ${result.status}` }] }
    }
}
