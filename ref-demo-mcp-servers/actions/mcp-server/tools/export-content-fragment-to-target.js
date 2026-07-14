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

// Exports one or more AEM content fragments to Adobe Target via AEM's
// .cfm.targetexport endpoint. Deliberately bypasses generic AEM API
// discovery (lookup-api-spec / write-api), which has been observed to
// silently create the offer via Target's own API instead - that shows up
// in Target as offer source "Adobe Target API" instead of the correct
// "Adobe Experience Manager". This tool makes the one, known-correct
// HTTP call every time.
//
// aem_host/aem_export_token are passed per call (not read from server
// env) because this MCP server is a shared hosted endpoint - callers
// bring their own AEM tenant + a bearer token scoped specifically to
// this export (separate from any AEM MCP connector's own OAuth, which
// this tool cannot reuse since it makes its own direct HTTP call).
module.exports = {
    name: 'export_content_fragment_to_target',
    description: 'Export one or more AEM content fragments to Adobe Target by calling AEM\'s .cfm.targetexport endpoint directly. Use this instead of generic AEM API discovery when creating Target offers from content fragments.',
    schema: {
        export_path: z.string().describe('Path to append ".cfm.targetexport" to - either a single fragment\'s own path, or a common parent folder when exporting several fragments at once'),
        fragment_paths: z.array(z.string()).describe('Full DAM paths of the content fragments to export, e.g. ["/content/dam/wknd-universal/cf/promotions/promo-default"]'),
        aem_host: z.string().describe('Base AEM host URL, e.g. "https://author-xxxx.adobeaemcloud.com"'),
        aem_export_token: z.string().describe('Bearer token scoped for this export call, separate from any AEM MCP connector OAuth session')
    },
    handler: async ({ export_path: exportPath, fragment_paths: fragmentPaths, aem_host: aemHost, aem_export_token: aemExportToken }) => {
        const url = `${aemHost.replace(/\/+$/, '')}${exportPath}.cfm.targetexport`
        const formFields = new URLSearchParams()
        fragmentPaths.forEach(path => formFields.append('paths', path))
        formFields.append('action', 'export')

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${aemExportToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formFields.toString()
            })

            const bodyText = await response.text()

            if (!response.ok) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `❌ AEM export error ${response.status}: ${bodyText}`
                        }
                    ]
                }
            }

            const result = JSON.parse(bodyText)
            return {
                content: [
                    {
                        type: 'text',
                        text: `Exported ${fragmentPaths.length} fragment(s) to Target:\n\n${JSON.stringify(result, null, 2)}`
                    }
                ],
                metadata: {
                    source: 'aem-to-target-export',
                    export_path: exportPath,
                    fragment_paths: fragmentPaths,
                    raw_data: result
                }
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ AEM export failed: ${error.message}`
                    }
                ]
            }
        }
    }
}
