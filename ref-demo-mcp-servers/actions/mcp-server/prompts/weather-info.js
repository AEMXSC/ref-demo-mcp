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

// Weather information prompt
module.exports = {
    name: 'weather-info',
    description: 'Simple prompt to explain the weather tool functionality',
    schema: {
        city: z.string().optional().describe('City name to use in the example')
    },
    handler: async ({ city = 'San Francisco' }) => {
        const template = `Explain how the weather tool works in this MCP server.

Example city: ${city}

The weather tool:
- Takes a city name as input
- Returns current weather information
- Shows temperature, conditions, humidity, wind, and other details
- Currently uses mock/example data for demonstration
- Can be replaced with real weather API calls for production use

Note: This is a demonstration tool that shows how to build weather functionality in an MCP server.`

        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: template
                    }
                }
            ]
        }
    }
}
