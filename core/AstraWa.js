/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Core
*/

const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@c-o-d-e-xx/baileys-revamped");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");

const ModuleManager = require("./ModuleManager");
const MessageHandler = require("./handlers/MessageHandler");
const EventHandler = require("./handlers/EventHandler");
const { makeInMemoryStore } = require("./database/Store");
const config = require("../config");

class AstraWa {
    constructor() {
        this.moduleManager = new ModuleManager();
        this.messageHandler = new MessageHandler(this.moduleManager);
        this.eventHandler = new EventHandler(this.moduleManager);
        this.store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
        this.sock = null;
        this.isConnected = false;
    }

    /**
     * Initialize AstraWa Bot
     */
    async init() {
        console.log(chalk.blue.bold('🌟 Initializing AstraWa Bot...'));
        
        // Load modules
        await this.moduleManager.loadModules();
        
        // Initialize database
        await this.initDatabase();
        
        console.log(chalk.green('✅ AstraWa initialized successfully!'));
    }

    /**
     * Initialize database
     */
    async initDatabase() {
        try {
            await config.DATABASE.authenticate();
            await config.DATABASE.sync();
            console.log(chalk.green('✅ Database connected successfully'));
        } catch (error) {
            console.log(chalk.red('❌ Database connection failed:'), error.message);
        }
    }

    /**
     * Connect to WhatsApp
     */
    async connect() {
        const { state, saveCreds } = await useMultiFileAuthState('./lib/temp/session');
        const { version, isLatest } = await fetchLatestBaileysVersion();
        
        console.log(chalk.blue(`Using WA v${version.join('.')}, isLatest: ${isLatest}`));

        this.sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            browser: ["AstraWa", "Desktop", "4.1.5"],
            auth: state,
            generateHighQualityLinkPreview: true,
            getMessage: async (key) => {
                if (this.store) {
                    const msg = await this.store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: "Hello, this is AstraWa!" };
            }
        });

        this.store.bind(this.sock.ev);
        
        // Handle connection events
        this.sock.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));
        this.sock.ev.on('creds.update', saveCreds);
        this.sock.ev.on('messages.upsert', (m) => this.messageHandler.handle(this.sock, m));
        this.sock.ev.on('group-participants.update', (update) => this.eventHandler.handleGroupUpdate(this.sock, update));
        
        console.log(chalk.green('🔗 Connecting to WhatsApp...'));
    }

    /**
     * Handle connection updates
     */
    handleConnectionUpdate(update) {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log(chalk.yellow('Connection closed due to'), lastDisconnect?.error);
            
            if (shouldReconnect) {
                console.log(chalk.blue('🔄 Reconnecting...'));
                this.connect();
            }
        } else if (connection === 'open') {
            this.isConnected = true;
            console.log(chalk.green.bold('🌟 AstraWa Connected Successfully!'));
            console.log(chalk.cyan(`📱 Bot Number: ${this.sock.user.id.split(':')[0]}`));
        }
    }

    /**
     * Start web interface
     */
    async startWeb() {
        const express = require('express');
        const app = express();
        const port = config.PORT || 8080;

        app.use(express.json());
        app.use(express.static('public'));

        // API Routes
        app.get('/api/stats', (req, res) => {
            res.json({
                connected: this.isConnected,
                modules: this.moduleManager.getStats(),
                uptime: process.uptime()
            });
        });

        app.get('/api/modules', (req, res) => {
            res.json(this.moduleManager.listModules());
        });

        app.post('/api/reload/:moduleId', async (req, res) => {
            try {
                await this.moduleManager.reloadModule(req.params.moduleId);
                res.json({ success: true, message: `Module ${req.params.moduleId} reloaded` });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });

        // Main page
        app.get('/', (req, res) => {
            res.send(`
                <html>
                <head><title>AstraWa Bot</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px;">
                    <h1>🌟 AstraWa Bot</h1>
                    <p>Advanced WhatsApp Bot with Dynamic Modular Architecture</p>
                    <p>Status: ${this.isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
                    <p>Modules: ${this.moduleManager.modules.size}</p>
                    <p>Commands: ${this.moduleManager.commands.size}</p>
                </body>
                </html>
            `);
        });

        app.listen(port, () => {
            console.log(chalk.green(`🌐 Web interface running on port ${port}`));
        });
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log(chalk.yellow('🔄 Shutting down AstraWa...'));
        
        if (this.sock) {
            await this.sock.logout();
        }
        
        console.log(chalk.green('✅ AstraWa shutdown complete'));
        process.exit(0);
    }
}

module.exports = AstraWa;