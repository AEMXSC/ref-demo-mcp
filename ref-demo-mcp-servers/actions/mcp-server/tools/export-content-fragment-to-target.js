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
const { getRequestAuth } = require('../request-context.js')

// Exports one or more AEM content fragments to Adobe Target via AEM's
// .cfm.targetexport endpoint. Deliberately bypasses generic AEM API
// discovery (lookup-api-spec / write-api), which has been observed to
// silently create the offer via Target's own API instead - that shows up
// in Target as offer source "Adobe Target API" instead of the correct
// "Adobe Experience Manager". This tool makes the one, known-correct
// HTTP call every time.
//
// aem_host is passed per call (not read from server env) because this MCP
// server is a shared hosted endpoint - callers bring their own AEM tenant.
// The bearer token for the export call is the caller's own IMS token,
// forwarded by the gateway as the request's Authorization header and
// threaded in via request-context.js - it is never a tool argument, so it
// can't be typed into chat or logged as part of a tool call.
module.exports = {
    name: 'export_content_fragment_to_target',
    description: 'Export one or more AEM content fragments to Adobe Target by calling AEM\'s .cfm.targetexport endpoint directly. Use this instead of generic AEM API discovery when creating Target offers from content fragments.',
    schema: {
        export_path: z.string().describe('Path to append ".cfm.targetexport" to - either a single fragment\'s own path, or a common parent folder when exporting several fragments at once'),
        fragment_paths: z.array(z.string()).describe('Full DAM paths of the content fragments to export, e.g. ["/content/dam/wknd-universal/cf/promotions/promo-default"]'),
        aem_host: z.string().describe('Base AEM host URL, e.g. "https://author-xxxx.adobeaemcloud.com"')
    },
    handler: async ({ export_path: exportPath, fragment_paths: fragmentPaths, aem_host: aemHost }) => {
        const { imsToken } = getRequestAuth()
        if (!imsToken) {
            return {
                content: [
                    {
                        type: 'text',
                        text: '❌ No IMS bearer token available on this request. The gateway/MCP client must forward the caller\'s Adobe IMS token in the Authorization header.'
                    }
                ]
            }
        }

        const url = `${aemHost.replace(/\/+$/, '')}${exportPath}.cfm.targetexport`
        const formFields = new URLSearchParams()
        fragmentPaths.forEach(path => formFields.append('paths', path))
        formFields.append('action', 'export')

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${imsToken}`,
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
