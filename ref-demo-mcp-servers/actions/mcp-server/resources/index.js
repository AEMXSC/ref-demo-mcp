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
 * MCP Server Resources registry
 *
 * Each resource lives in its own file under this directory and exports
 * { name, uri, metadata, handler }. To add a new resource, create a file
 * and add it to the `resources` array below - no other code needs to change.
 */

const exampleResource1 = require('./example-resource-1')
const apiDocs = require('./api-docs')
const configSettings = require('./config-settings')

const resources = [exampleResource1, apiDocs, configSettings]

/**
 * Register resources with the MCP server
 * Resources provide static content that AI assistants can access
 * @param {McpServer} server - The MCP server instance
 */
function registerResources (server) {
    resources.forEach(({ name, uri, metadata, handler }) => {
        server.resource(name, uri, metadata, handler)
    })
}

module.exports = { registerResources }
