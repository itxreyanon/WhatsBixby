/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Core Module
*/

const { personalDB } = require("../core/database");
const config = require("../config");
const os = require("os");

module.exports = {
    info: {
        name: "Core Commands",
        description: "Essential bot commands and utilities",
        version: "1.0.0",
        category: "core"
    },

    commands: [
        {
            pattern: "menu",
            desc: "Show bot menu",
            usage: "menu",
            fromMe: false,
            function: async (message, match) => {
                const moduleManager = message.client.moduleManager;
                const menuText = moduleManager.getMenuText(config.BOT_INFO);
                
                const image = config.BOT_INFO.match(/https?:\/\/[^\s;,|]+\.(jpg|jpeg|png|gif)/i);
                
                if (image) {
                    return await message.send({ url: image[0] }, { caption: menuText }, 'image');
                } else {
                    return await message.send(menuText);
                }
            }
        },

        {
            pattern: "alive",
            desc: "Check if bot is alive",
            usage: "alive",
            fromMe: false,
            function: async (message, match) => {
                if (match === "get" && message.isCreator) {
                    const { alive } = await personalDB(['alive'], { content: {} }, 'get');
                    return await message.send(alive || "_hey I am alive now &sender_");
                } else if (match && message.isCreator) {
                    await personalDB(['alive'], { content: match }, 'set');
                    return await message.send('*✅ Alive message updated successfully*');
                }

                const { alive } = await personalDB(['alive'], { content: {} }, 'get');
                const aliveMsg = alive || "_hey I am alive now &sender_";
                
                const startTime = Date.now();
                const platform = os.platform();
                const uptime = process.uptime();
                
                let text = aliveMsg
                    .replace(/&sender/gi, `@${message.number}`)
                    .replace(/&version/gi, require('../package.json').version)
                    .replace(/&platform/gi, platform)
                    .replace(/&uptime/gi, formatUptime(uptime))
                    .replace(/&speed/gi, `${Date.now() - startTime}ms`);

                if (aliveMsg.includes('&sender')) {
                    return await message.send(text, { mentions: [message.sender] });
                } else {
                    return await message.send(text);
                }
            }
        },

        {
            pattern: "ping",
            desc: "Check bot response time",
            usage: "ping",
            fromMe: false,
            function: async (message, match) => {
                const start = Date.now();
                const msg = await message.send('🏓 Pinging...');
                const end = Date.now();
                
                await message.client.sendMessage(message.jid, {
                    text: `🏓 *Pong!*\n⚡ *Response Time:* ${end - start}ms`,
                    edit: msg.key
                });
            }
        },

        {
            pattern: "restart",
            desc: "Restart the bot",
            usage: "restart",
            fromMe: true,
            function: async (message, match) => {
                await message.send('🔄 *Restarting AstraWa...*');
                process.exit(0);
            }
        },

        {
            pattern: "stats",
            desc: "Show bot statistics",
            usage: "stats",
            fromMe: false,
            function: async (message, match) => {
                const moduleManager = message.client.moduleManager;
                const stats = moduleManager.getStats();
                const uptime = formatUptime(process.uptime());
                const memUsage = formatBytes(process.memoryUsage().heapUsed);
                
                const statsText = `*📊 AstraWa Statistics*\n\n` +
                    `*🔧 Modules:* ${stats.modules}\n` +
                    `*⚡ Commands:* ${stats.commands}\n` +
                    `*📡 Events:* ${stats.events}\n` +
                    `*📂 Categories:* ${stats.categories}\n` +
                    `*⏱️ Uptime:* ${uptime}\n` +
                    `*💾 Memory:* ${memUsage}\n` +
                    `*🤖 Platform:* ${os.platform()}\n` +
                    `*📱 Node.js:* ${process.version}`;
                
                return await message.send(statsText);
            }
        }
    ],

    events: [
        {
            type: "all",
            function: async (message) => {
                // Global message logger
                if (message.body && !message.fromMe) {
                    console.log(`📨 ${message.pushName}: ${message.body.substring(0, 50)}${message.body.length > 50 ? '...' : ''}`);
                }
            }
        }
    ]
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}