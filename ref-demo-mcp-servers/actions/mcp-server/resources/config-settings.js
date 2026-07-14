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

// Configuration resource
module.exports = {
    name: 'config-settings',
    uri: 'config://settings',
    metadata: {
        name: 'Configuration Settings',
        description: 'Example configuration and settings reference',
        mimeType: 'application/json'
    },
    handler: async () => {
        const config = {
            server: {
                name: 'my-mcp-server',
                version: '1.0.0',
                environment: 'production'
            },
            features: {
                tools_enabled: true,
                resources_enabled: true,
                prompts_enabled: true
            },
            limits: {
                max_response_size: '1MB',
                timeout: '30s'
            },
            note: 'CUSTOMIZE: Replace with your actual configuration schema'
        }

        return {
            contents: [
                {
                    uri: 'config://settings',
                    text: JSON.stringify(config, null, 2),
                    mimeType: 'application/json'
                }
            ]
        }
    }
}
