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
 * MCP Server Tools registry
 *
 * Each tool lives in its own file under this directory and exports
 * { name, description, schema, handler }. To add a new tool, create a file
 * and add it to the `tools` array below - no other code needs to change.
 */

const echo = require('./echo')
const calculator = require('./calculator')
const weather = require('./weather')
const exportContentFragmentToTarget = require('./export-content-fragment-to-target')
const getAtjs = require('./get-atjs')

const tools = [echo, calculator, weather, exportContentFragmentToTarget, getAtjs]

/**
 * Register all tools with the MCP server
 * @param {McpServer} server - The MCP server instance
 * @param {object} params - Adobe I/O Runtime action params (env vars/inputs)
 */
function registerTools (server, params) {
    tools.forEach(({ name, description, schema, handler }) => {
        server.tool(name, description, schema, (args) => handler(args, params))
    })
}

module.exports = { registerTools }
