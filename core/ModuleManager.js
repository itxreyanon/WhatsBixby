/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Module Manager
*/

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class ModuleManager {
    constructor() {
        this.modules = new Map();
        this.commands = new Map();
        this.events = new Map();
        this.categories = new Map();
        this.modulesPath = path.join(__dirname, '../modules');
    }

    /**
     * Load all modules from the modules directory
     */
    async loadModules() {
        console.log(chalk.blue('📦 Loading AstraWa Modules...'));
        
        if (!fs.existsSync(this.modulesPath)) {
            fs.mkdirSync(this.modulesPath, { recursive: true });
            console.log(chalk.yellow('📁 Created modules directory'));
        }

        const moduleFiles = fs.readdirSync(this.modulesPath)
            .filter(file => file.endsWith('.js'));

        for (const file of moduleFiles) {
            await this.loadModule(file);
        }

        console.log(chalk.green(`✅ Loaded ${this.modules.size} modules with ${this.commands.size} commands`));
        this.generateMenu();
    }

    /**
     * Load a single module
     */
    async loadModule(filename) {
        try {
            const modulePath = path.join(this.modulesPath, filename);
            const moduleId = path.basename(filename, '.js');
            
            // Clear require cache for hot reload
            delete require.cache[require.resolve(modulePath)];
            
            const moduleData = require(modulePath);
            
            if (!moduleData.info) {
                console.log(chalk.yellow(`⚠️  Module ${filename} missing info object`));
                return;
            }

            const module = {
                id: moduleId,
                filename,
                path: modulePath,
                ...moduleData
            };

            this.modules.set(moduleId, module);
            
            // Register commands
            if (module.commands) {
                for (const command of module.commands) {
                    command.moduleId = moduleId;
                    this.commands.set(command.pattern, command);
                }
            }

            // Register events
            if (module.events) {
                for (const event of module.events) {
                    event.moduleId = moduleId;
                    if (!this.events.has(event.type)) {
                        this.events.set(event.type, []);
                    }
                    this.events.get(event.type).push(event);
                }
            }

            // Register category
            if (module.info.category) {
                if (!this.categories.has(module.info.category)) {
                    this.categories.set(module.info.category, []);
                }
                this.categories.get(module.info.category).push(module);
            }

            console.log(chalk.green(`✓ Loaded module: ${module.info.name}`));
            
        } catch (error) {
            console.log(chalk.red(`❌ Failed to load module ${filename}:`), error.message);
        }
    }

    /**
     * Reload a specific module
     */
    async reloadModule(moduleId) {
        const module = this.modules.get(moduleId);
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }

        // Remove old commands and events
        this.removeModuleData(moduleId);
        
        // Reload module
        await this.loadModule(module.filename);
        
        console.log(chalk.blue(`🔄 Reloaded module: ${moduleId}`));
    }

    /**
     * Remove module data from memory
     */
    removeModuleData(moduleId) {
        // Remove commands
        for (const [pattern, command] of this.commands.entries()) {
            if (command.moduleId === moduleId) {
                this.commands.delete(pattern);
            }
        }

        // Remove events
        for (const [type, events] of this.events.entries()) {
            const filtered = events.filter(event => event.moduleId !== moduleId);
            if (filtered.length === 0) {
                this.events.delete(type);
            } else {
                this.events.set(type, filtered);
            }
        }

        // Remove from categories
        for (const [category, modules] of this.categories.entries()) {
            const filtered = modules.filter(module => module.id !== moduleId);
            if (filtered.length === 0) {
                this.categories.delete(category);
            } else {
                this.categories.set(category, filtered);
            }
        }

        this.modules.delete(moduleId);
    }

    /**
     * Get command by pattern
     */
    getCommand(pattern) {
        return this.commands.get(pattern);
    }

    /**
     * Get events by type
     */
    getEvents(type) {
        return this.events.get(type) || [];
    }

    /**
     * Generate dynamic menu
     */
    generateMenu() {
        const menu = {
            categories: {},
            totalCommands: this.commands.size,
            totalModules: this.modules.size
        };

        for (const [category, modules] of this.categories.entries()) {
            menu.categories[category] = {
                modules: modules.length,
                commands: []
            };

            for (const module of modules) {
                if (module.commands) {
                    for (const command of module.commands) {
                        menu.categories[category].commands.push({
                            pattern: command.pattern,
                            desc: command.desc || 'No description',
                            usage: command.usage || command.pattern
                        });
                    }
                }
            }
        }

        this.menu = menu;
        return menu;
    }

    /**
     * Get formatted menu text
     */
    getMenuText(botInfo) {
        const info_vars = botInfo.split(/[;,|]/);
        let menuText = `*╭─「 🌟 ASTRAWA BOT 🌟 」*\n`;
        menuText += `*│ Owner: ${info_vars[0] || 'AstraWa'}*\n`;
        menuText += `*│ Modules: ${this.modules.size}*\n`;
        menuText += `*│ Commands: ${this.commands.size}*\n`;
        menuText += `*│ Version: 4.1.5*\n`;
        menuText += `*╰────────────────*\n\n`;

        for (const [category, data] of Object.entries(this.menu.categories)) {
            menuText += `*╭─「 ${category.toUpperCase()} 」*\n`;
            
            for (const command of data.commands) {
                menuText += `*│* \`${command.pattern}\`\n`;
                menuText += `*│* _${command.desc}_\n`;
            }
            
            menuText += `*╰────────────────*\n\n`;
        }

        return menuText;
    }

    /**
     * Get module statistics
     */
    getStats() {
        return {
            modules: this.modules.size,
            commands: this.commands.size,
            events: Array.from(this.events.values()).flat().length,
            categories: this.categories.size
        };
    }

    /**
     * List all modules
     */
    listModules() {
        const moduleList = [];
        for (const [id, module] of this.modules.entries()) {
            moduleList.push({
                id,
                name: module.info.name,
                description: module.info.description,
                version: module.info.version,
                category: module.info.category,
                commands: module.commands ? module.commands.length : 0
            });
        }
        return moduleList;
    }
}

module.exports = ModuleManager;