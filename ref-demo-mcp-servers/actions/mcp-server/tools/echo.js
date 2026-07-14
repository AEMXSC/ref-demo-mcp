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

// Basic echo tool for testing connectivity
module.exports = {
    name: 'echo',
    description: 'A simple utility tool that echoes back the input message. Useful for testing connectivity, debugging, or confirming that the MCP server is responding correctly to requests.',
    schema: {
        message: z.string().describe('The message you want to echo back - useful for testing and debugging')
    },
    handler: async ({ message = 'No message provided' }) => {
        return {
            content: [
                {
                    type: 'text',
                    text: `Echo: ${message}`
                }
            ]
        }
    }
}
