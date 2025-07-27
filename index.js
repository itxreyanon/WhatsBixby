/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Main Entry Point
*/

const AstraWa = require("./core/AstraWa");
const chalk = require("chalk");

// ASCII Art Banner
console.log(chalk.cyan(`
╔═══════════════════════════════════════╗
║                                       ║
║     🌟 AstraWa Bot Starting... 🌟     ║
║                                       ║
║   Advanced WhatsApp Bot Framework     ║
║   Dynamic Modular Architecture        ║
║                                       ║
╚═══════════════════════════════════════╝
`));

async function startAstraWa() {
    try {
        const bot = new AstraWa();
        
        // Initialize bot
        await bot.init();
        
        // Connect to WhatsApp
        await bot.connect();
        
        // Start web interface
        await bot.startWeb();
        
        // Handle graceful shutdown
        process.on('SIGINT', () => bot.shutdown());
        process.on('SIGTERM', () => bot.shutdown());
        
    } catch (error) {
        console.log(chalk.red('❌ Failed to start AstraWa:'), error);
        process.exit(1);
    }
}

// Start the bot
startAstraWa();