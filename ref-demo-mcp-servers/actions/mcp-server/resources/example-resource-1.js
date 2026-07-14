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

// Example static resource
module.exports = {
    name: 'example-resource-1',
    uri: 'example://resource1',
    metadata: {
        name: 'Example Resource 1',
        description: 'A sample text resource for demonstration purposes',
        mimeType: 'text/plain'
    },
    handler: async () => {
        return {
            contents: [
                {
                    uri: 'example://resource1',
                    text: 'This is the content of example resource 1. It demonstrates how resources work in the MCP protocol. Resources can contain documentation, reference data, configuration files, or any static content your AI assistant might need.',
                    mimeType: 'text/plain'
                }
            ]
        }
    }
}
