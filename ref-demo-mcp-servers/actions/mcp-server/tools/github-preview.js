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

// Equivalent of gh-site's `preview` subcommand - no GitHub login needed,
// it's just an HTTP status check against the public .aem.page URL.
module.exports = {
    name: 'github_preview',
    description: 'Check whether a site preview URL resolves (HTTP status). No GitHub login required.',
    schema: {
        url: z.string().describe('Preview URL to check, e.g. https://main--repo--owner.aem.page')
    },
    handler: async ({ url }) => {
        try {
            const response = await fetch(url, { method: 'GET' })
            return { content: [{ type: 'text', text: String(response.status) }], metadata: { status: response.status } }
        } catch (error) {
            return { content: [{ type: 'text', text: `❌ preview check failed: ${error.message}` }] }
        }
    }
}
