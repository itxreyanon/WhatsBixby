/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Admin Module
*/

const { personalDB } = require("../core/database");
const fs = require("fs");
const path = require("path");

module.exports = {
    info: {
        name: "Admin Commands",
        description: "Administrative commands for bot management",
        version: "1.0.0",
        category: "admin"
    },

    commands: [
        {
            pattern: "modules",
            desc: "List all loaded modules",
            usage: "modules",
            fromMe: true,
            function: async (message, match) => {
                const moduleManager = message.client.moduleManager;
                const modules = moduleManager.listModules();
                
                let moduleText = `*📦 AstraWa Modules (${modules.length})*\n\n`;
                
                modules.forEach((module, index) => {
                    moduleText += `*${index + 1}.* \`${module.name}\`\n`;
                    moduleText += `   📝 ${module.description}\n`;
                    moduleText += `   📂 Category: ${module.category}\n`;
                    moduleText += `   ⚡ Commands: ${module.commands}\n`;
                    moduleText += `   🔢 Version: ${module.version}\n\n`;
                });

                return await message.send(moduleText);
            }
        },

        {
            pattern: "reload",
            desc: "Reload a specific module",
            usage: "reload <module_id>",
            fromMe: true,
            function: async (message, match) => {
                if (!match) {
                    return await message.send('🔄 *Provide module ID to reload*\nUse `modules` to see available modules');
                }

                try {
                    const moduleManager = message.client.moduleManager;
                    await moduleManager.reloadModule(match);
                    return await message.send(`✅ *Module '${match}' reloaded successfully*`);
                } catch (error) {
                    return await message.send(`❌ *Failed to reload module '${match}': ${error.message}*`);
                }
            }
        },

        {
            pattern: "ban",
            desc: "Ban bot from specific chat",
            usage: "ban",
            fromMe: true,
            function: async (message, match) => {
                try {
                    const { ban } = await personalDB(['ban'], { content: {} }, 'get');
                    
                    if (ban && ban.includes(message.jid)) {
                        return await message.send('❌ *Bot already banned in this chat*');
                    }

                    const update = ban ? ban + ',' + message.jid : message.jid;
                    await personalDB(['ban'], { content: update }, 'set');
                    
                    await message.send('🚫 *Bot banned in this chat*');
                    return process.exit(0);
                } catch (error) {
                    return await message.send('❌ *Failed to ban bot*');
                }
            }
        },

        {
            pattern: "unban",
            desc: "Unban bot from specific chat",
            usage: "unban",
            fromMe: true,
            function: async (message, match) => {
                try {
                    const { ban } = await personalDB(['ban'], { content: {} }, 'get');
                    
                    if (!ban || !ban.includes(message.jid)) {
                        return await message.send('ℹ️ *Bot not banned in this chat*');
                    }

                    const update = ban.split(',').filter(jid => jid !== message.jid).join(',');
                    await personalDB(['ban'], { content: update }, 'set');
                    
                    await message.send('✅ *Bot unbanned in this chat*');
                    return process.exit(0);
                } catch (error) {
                    return await message.send('❌ *Failed to unban bot*');
                }
            }
        },

        {
            pattern: "setcmd",
            desc: "Set sticker as command",
            usage: "setcmd <command_name> (reply to sticker)",
            fromMe: true,
            function: async (message, match) => {
                if (!message.reply_message?.sticker) {
                    return await message.send('📎 *Reply to a sticker to set as command*');
                }

                if (!match) {
                    return await message.send('📝 *Provide command name*\nExample: `setcmd hello`');
                }

                try {
                    const stickerHash = message.reply_message.sticker.fileSha256?.join('');
                    if (!stickerHash) {
                        return await message.send('❌ *Failed to get sticker hash*');
                    }

                    await personalDB(['sticker_cmd'], { 
                        content: { [match]: stickerHash } 
                    }, 'add');
                    
                    return await message.send(`✅ *Sticker set as command: ${match}*`);
                } catch (error) {
                    return await message.send('❌ *Failed to set sticker command*');
                }
            }
        },

        {
            pattern: "delcmd",
            desc: "Delete sticker command",
            usage: "delcmd <command_name>",
            fromMe: true,
            function: async (message, match) => {
                if (!match) {
                    return await message.send('📝 *Provide command name to delete*');
                }

                try {
                    await personalDB(['sticker_cmd'], { 
                        content: { id: match } 
                    }, 'delete');
                    
                    return await message.send(`✅ *Sticker command '${match}' deleted*`);
                } catch (error) {
                    return await message.send('❌ *Failed to delete sticker command*');
                }
            }
        },

        {
            pattern: "getcmd",
            desc: "List all sticker commands",
            usage: "getcmd",
            fromMe: true,
            function: async (message, match) => {
                try {
                    const { sticker_cmd } = await personalDB(['sticker_cmd'], { content: {} }, 'get');
                    
                    if (!Object.keys(sticker_cmd)[0]) {
                        return await message.send('ℹ️ *No sticker commands found*');
                    }

                    let cmdList = '*📎 Sticker Commands*\n\n';
                    let count = 1;
                    
                    for (const cmd in sticker_cmd) {
                        cmdList += `${count++}. \`${cmd}\`\n`;
                    }

                    return await message.send(cmdList);
                } catch (error) {
                    return await message.send('❌ *Failed to get sticker commands*');
                }
            }
        },

        {
            pattern: "eval",
            desc: "Execute JavaScript code",
            usage: "eval <code>",
            fromMe: true,
            function: async (message, match) => {
                if (!match) {
                    return await message.send('💻 *Provide JavaScript code to execute*');
                }

                try {
                    let result = await eval(`(async () => { ${match} })()`);
                    if (typeof result !== "string") {
                        result = require("util").inspect(result);
                    }
                    return await message.send(`💻 *Eval Result:*\n\`\`\`${result}\`\`\``);
                } catch (error) {
                    return await message.send(`❌ *Eval Error:*\n\`\`\`${error.message}\`\`\``);
                }
            }
        }
    ]
};