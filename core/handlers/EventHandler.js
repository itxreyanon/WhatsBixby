/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Event Handler
*/

const { groupDB } = require("../database");
const greetings = require("../../utils/helpers/greetings");

class EventHandler {
    constructor(moduleManager) {
        this.moduleManager = moduleManager;
    }

    /**
     * Handle group participant updates
     */
    async handleGroupUpdate(sock, update) {
        try {
            const { id, participants, action } = update;
            
            // Get group settings
            const { welcome, exit } = await groupDB(['welcome', 'exit'], { jid: id, content: {} }, 'get');
            
            // Handle greetings
            if ((action === 'add' && welcome) || (action === 'remove' && exit)) {
                const groupUpdate = {
                    id,
                    participants,
                    action
                };
                
                await greetings(groupUpdate, sock, { welcome, exit });
            }
            
        } catch (error) {
            console.log('Group update error:', error);
        }
    }

    /**
     * Handle call events
     */
    async handleCall(sock, call) {
        try {
            if (config.ANTI_CALL === 'true' || config.ANTI_CALL === 'block') {
                await sock.rejectCall(call.id, call.from);
                
                if (config.ANTI_CALL === 'block') {
                    await sock.updateBlockStatus(call.from, 'block');
                }
            }
        } catch (error) {
            console.log('Call handler error:', error);
        }
    }
}

module.exports = EventHandler;