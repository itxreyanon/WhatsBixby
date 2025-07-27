/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Helpers
*/

const axios = require("axios");
const fs = require("fs");
const config = require("../../config");

/**
 * Get buffer from URL or file
 */
async function getBuffer(path, save = false) {
    let filename;
    let data = Buffer.isBuffer(path) ? path : 
               /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], "base64") : 
               /^https?:\/\//.test(path) ? await (await axios.get(path, { responseType: 'arraybuffer' })).data : 
               fs.existsSync(path) ? ((filename = path), fs.readFileSync(path)) : 
               typeof path === "string" ? path : Buffer.alloc(0);
    
    return data;
}

/**
 * Fetch JSON from URL
 */
async function fetchJson(url, options = {}) {
    try {
        const response = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            ...options
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

/**
 * Get JSON with error handling
 */
async function getJson(url, options = {}) {
    try {
        const res = await axios({
            method: "GET",
            url,
            headers: { "User-Agent": "Mozilla/5.0" },
            ...options,
        });
        return res.data;
    } catch (err) {
        return { error: err.message };
    }
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if string is URL
 */
function isUrl(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

/**
 * Extract URLs from string
 */
function extractUrlsFromString(text) {
    if (!text) return false;
    const regexp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()'@:%_\+.~#?!&//=]*)/gi;
    return text.match(regexp) || false;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get runtime
 */
function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);
    
    const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
    const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
    
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

/**
 * Generate random string
 */
function getRandom(ext = '') {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
}

module.exports = {
    getBuffer,
    fetchJson,
    getJson,
    sleep,
    isUrl,
    extractUrlsFromString,
    formatBytes,
    runtime,
    getRandom
};