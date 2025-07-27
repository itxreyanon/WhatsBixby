/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Message Handler
*/

const { serialize } = require("../message/MessageSerializer");
const { personalDB } = require("../database");
const config = require("../../config");
const chalk = require("chalk");

class MessageHandler {
    constructor(moduleManager) {
        this.moduleManager = moduleManager;
        this.PREFIX = this.getPrefix();
        this.MODE = this.getMode();
    }

    getPrefix() {
        const configPrefix = config.PREFIX;
        if (!configPrefix || configPrefix === 'false' || configPrefix === 'null') return "";
        return configPrefix.includes('[') && configPrefix.includes(']') ? configPrefix[2] : configPrefix.trim();
    }

    getMode() {
        return !config.WORKTYPE || config.WORKTYPE.toLowerCase().trim() !== 'public';
    }

    /**
     * Handle incoming messages
     */
    async handle(sock, { messages, type }) {
        if (type !== 'notify') return;

        for (const message of messages) {
            try {
                await this.processMessage(sock, message);
            } catch (error) {
                console.log(chalk.red('❌ Message processing error:'), error);
            }
        }
    }

    /**
     * Process individual message
     */
    async processMessage(sock, rawMessage) {
        const message = await serialize(sock, rawMessage);
        if (!message) return;

        // Check if bot is banned in this chat
        if (await this.isBotBanned(message.jid)) return;

        // Check if bot is shut off
        if (await this.isBotShutOff()) return;

        // Handle sticker commands
        if (await this.handleStickerCommand(message)) return;

        // Handle text commands
        if (message.body && this.PREFIX) {
            if (message.body.startsWith(this.PREFIX)) {
                await this.handleCommand(message);
                return;
            }
        }

        // Handle events (all messages, mentions, etc.)
        await this.handleEvents(message);
    }

    /**
     * Handle command execution
     */
    async handleCommand(message) {
        const commandText = message.body.slice(this.PREFIX.length).trim();
        const [commandName, ...args] = commandText.split(' ');
        const match = args.join(' ');

        // Find command
        const command = this.findCommand(commandName);
        if (!command) return;

        // Check permissions
        if (!this.checkPermissions(message, command)) return;

        // Check if command is toggled off
        if (await this.isCommandToggled(commandName)) return;

        try {
            console.log(chalk.blue(`📨 Command: ${commandName} from ${message.pushName}`));
            
            // Execute command
            await command.function(message, match, commandName);
            
        } catch (error) {
            console.log(chalk.red(`❌ Command error (${commandName}):`), error);
            await message.send('❌ An error occurred while executing the command.');
        }
    }

    /**
     * Find command by pattern
     */
    findCommand(commandName) {
        for (const [pattern, command] of this.moduleManager.commands.entries()) {
            const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            if (regex.test(commandName)) {
                return command;
            }
        }
        return null;
    }

    /**
     * Handle events (mentions, all messages, etc.)
     */
    async handleEvents(message) {
        const events = [
            ...this.moduleManager.getEvents('all'),
            ...this.moduleManager.getEvents('text'),
            ...(message.mention.isBotNumber ? this.moduleManager.getEvents('mention') : [])
        ];

        for (const event of events) {
            try {
                if (this.checkPermissions(message, event)) {
                    await event.function(message);
                }
            } catch (error) {
                console.log(chalk.red('❌ Event handler error:'), error);
            }
        }
    }

    /**
     * Handle sticker commands
     */
    async handleStickerCommand(message) {
        if (!message.sticker) return false;

        try {
            const { sticker_cmd } = await personalDB(['sticker_cmd'], { content: {} }, 'get');
            const stickerHash = message.sticker.fileSha256?.join('');
            
            if (stickerHash && sticker_cmd[stickerHash]) {
                const commandName = sticker_cmd[stickerHash];
                const command = this.findCommand(commandName);
                
                if (command && this.checkPermissions(message, command)) {
                    await command.function(message, '', commandName);
                    return true;
                }
            }
        } catch (error) {
            console.log(chalk.red('❌ Sticker command error:'), error);
        }

        return false;
    }

    /**
     * Check command permissions
     */
    checkPermissions(message, command) {
        // Check if command requires owner permissions
        if (command.fromMe && !message.isCreator) return false;
        
        // Check if command is group only
        if (command.onlyGroup && !message.isGroup) return false;
        
        // Check if command requires admin
        if (command.onlyAdmin && !message.isCreator) return false;
        
        // Check work mode
        if (this.MODE && !message.isCreator) return false;
        
        return true;
    }

    /**
     * Check if bot is banned in chat
     */
    async isBotBanned(jid) {
        try {
            const { ban } = await personalDB(['ban'], { content: {} }, 'get');
            return ban && ban.includes(jid);
        } catch {
            return false;
        }
    }

    /**
     * Check if bot is shut off
     */
    async isBotShutOff() {
        try {
            const { shutoff } = await personalDB(['shutoff'], { content: {} }, 'get');
            return shutoff === 'true';
        } catch {
            return false;
        }
    }

    /**
     * Check if command is toggled off
     */
    async isCommandToggled(commandName) {
        try {
            const { toggle } = await personalDB(['toggle'], { content: {} }, 'get');
            return toggle && toggle[commandName] === 'false';
        } catch {
            return false;
        }
    }
}

module.exports = MessageHandler;