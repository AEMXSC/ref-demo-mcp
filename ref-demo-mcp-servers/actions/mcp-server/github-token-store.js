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

// Server-side store for the GitHub device-flow login (github_login /
// github_login_status) and the resulting access token, keyed by an opaque
// session_id the caller carries across tool calls. Uses Adobe I/O Runtime's
// State SDK so this action stays stateless between invocations while still
// letting a login started in one call be completed/reused in later ones.

const { State } = require('@adobe/aio-sdk')
const crypto = require('crypto')

let statePromise = null
function getState () {
    if (!statePromise) statePromise = State.init()
    return statePromise
}

function newSessionId () {
    return crypto.randomBytes(16).toString('hex')
}

// GitHub device codes expire in ~15 minutes; give the token a long TTL since
// there's no refresh flow wired up yet - a fresh github_login replaces it.
const DEVICE_TTL_SECONDS = 15 * 60
const TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60

async function putDeviceFlow (sessionId, deviceFlow) {
    const state = await getState()
    await state.put(`github:device:${sessionId}`, JSON.stringify(deviceFlow), { ttl: DEVICE_TTL_SECONDS })
}

async function getDeviceFlow (sessionId) {
    const state = await getState()
    const result = await state.get(`github:device:${sessionId}`)
    return result?.value ? JSON.parse(result.value) : null
}

async function putToken (sessionId, token) {
    const state = await getState()
    await state.put(`github:token:${sessionId}`, JSON.stringify(token), { ttl: TOKEN_TTL_SECONDS })
}

async function getToken (sessionId) {
    const state = await getState()
    const result = await state.get(`github:token:${sessionId}`)
    return result?.value ? JSON.parse(result.value) : null
}

module.exports = { newSessionId, putDeviceFlow, getDeviceFlow, putToken, getToken }
