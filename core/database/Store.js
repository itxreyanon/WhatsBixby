/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Store
*/

const fs = require("fs");
const chalk = require("chalk");
const events = require('events');
const pino = require('pino');

class InMemoryStore extends events.EventEmitter {
    constructor(options = {}) {
        super();
        this.contacts = {};
        this.chats = {};
        this.messages = {};
        this.presences = {};
        this.groupMetadata = {};
        this.logger = options.logger || pino({ level: 'silent' });
    }

    load(state = {}) {
        try {
            Object.assign(this, state);
            this.logger.info('Store loaded');
        } catch (e) {
            this.logger.error('Failed to load store: ' + e.message);
        }
    }

    save() {
        try {
            const state = {
                contacts: this.contacts,
                chats: this.chats,
                messages: this.messages,
                presences: this.presences,
                groupMetadata: this.groupMetadata,
            };
            this.logger.debug('Store saved');
            return state;
        } catch (e) {
            this.logger.error('Failed to save store: ' + e.message);
            return {};
        }
    }

    clear() {
        this.contacts = {};
        this.chats = {};
        this.messages = {};
        this.presences = {};
        this.groupMetadata = {};
        this.logger.info('Store cleared');
    }

    loadMessage(jid, id) {
        if (!jid || !id) return undefined;
        return this.messages[jid]?.[id];
    }

    bind(ev) {
        if (!ev?.on) throw new Error('Event emitter is required for binding');
        
        ev.on('contacts.set', (contacts) => this.contacts = { ...this.contacts, ...contacts });
        ev.on('chats.set', (chats) => this.chats = { ...this.chats, ...chats });
        ev.on('messages.set', ({ messages, jid }) => {
            this.messages[jid] = messages.reduce((acc, msg) => {
                if (msg?.key?.id) acc[msg.key.id] = msg;
                return acc;
            }, {});
        });
        ev.on('messages.upsert', ({ messages }) => {
            messages.forEach(msg => {
                const chatId = msg?.key?.remoteJid;
                if (chatId && msg?.key?.id) {
                    if (!this.messages[chatId]) this.messages[chatId] = {};
                    this.messages[chatId][msg.key.id] = msg;
                }
            });
        });
    }
}

function makeInMemoryStore(options) {
    return new InMemoryStore(options);
}

module.exports = { makeInMemoryStore };