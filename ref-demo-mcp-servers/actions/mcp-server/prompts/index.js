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

/**
 * MCP Server Prompts registry
 *
 * Each prompt lives in its own file under this directory and exports
 * { name, description, schema, handler }. To add a new prompt, create a file
 * and add it to the `prompts` array below - no other code needs to change.
 */

const weatherInfo = require('./weather-info')

const prompts = [weatherInfo]

/**
 * Register prompts with the MCP server
 * Prompts are reusable templates that AI assistants can use
 * @param {McpServer} server - The MCP server instance
 */
function registerPrompts (server) {
    prompts.forEach(({ name, description, schema, handler }) => {
        server.prompt(name, description, schema, handler)
    })
}

module.exports = { registerPrompts }
