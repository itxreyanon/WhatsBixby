/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Message Serializer
*/

const {
    generateWAMessageContent,
    extractMessageContent,
    jidNormalizedUser,
    getContentType,
    proto,
    downloadMediaMessage,
    generateWAMessageFromContent,
    areJidsSameUser,
    WA_DEFAULT_EPHEMERAL
} = require("@c-o-d-e-xx/baileys-revamped");

const fs = require("fs");
const FileType = require("file-type");
const path = require("path");
const PhoneNumber = require("awesome-phonenumber");
const { getBuffer } = require("../../utils/helpers");
const { toAudio, toPTT } = require("../../utils/media");
const config = require("../../config");
const { writeExifImg, writeExifVid, writeExifWebp } = require("../../utils/media/sticker");

/**
 * Serialize WhatsApp message
 */
async function serialize(sock, m) {
    if (!m) return m;
    
    m = proto.WebMessageInfo.fromObject(m);
    
    // Basic message properties
    m.client = sock;
    m.isCreator = false;
    m.sudo = config.SUDO.split(',').map(s => s.trim() + '@s.whatsapp.net');
    m.owners = [jidNormalizedUser(sock.user.id), ...m.sudo];
    
    // Message type and content
    m.type = getContentType(m.message);
    m.message = extractMessageContent(m.message);
    m.msg = m.message[m.type];
    
    // Key information
    if (m.key) {
        m.from = m.jid = m.chat = jidNormalizedUser(m.key.remoteJid || m.key.participant);
        m.fromMe = m.key.fromMe;
        m.id = m.key.id;
        m.isBot = m.id?.startsWith("BAE5") && m.id.length === 16;
        m.isGroup = m.from.endsWith("@g.us");
        m.sender = jidNormalizedUser((m.fromMe && sock.user?.id) || m.key.participant || m.from || "");
    }

    // User information
    m.pushName = m.pushName || "No Name";
    m.number = m.sender.replace(/[^0-9]/g, '');
    m.isCreator = m.owners.includes(m.sender);
    m.botNumber = jidNormalizedUser(sock.user.id);
    
    // Message content
    m.body = m.text = m.message?.conversation || 
                     m.message?.[m.type]?.text || 
                     m.message?.[m.type]?.caption || 
                     m.message?.[m.type]?.contentText || 
                     m.message?.[m.type]?.selectedDisplayText || 
                     m.message?.[m.type]?.title || "";

    // Media information
    m.image = m.message?.imageMessage || false;
    m.video = m.message?.videoMessage || false;
    m.sticker = m.message?.stickerMessage || false;
    m.audio = m.message?.audioMessage || false;
    m.document = m.message?.documentMessage || false;
    m.location = m.message?.locationMessage || false;
    m.contact = m.message?.contactMessage || false;

    // Mentions
    m.mention = {
        jid: m.msg?.contextInfo?.mentionedJid || [],
        isBotNumber: false,
        isOwner: false
    };
    m.mention.isBotNumber = m.mention.jid.includes(m.botNumber);
    m.mention.isOwner = m.owners.some(owner => m.mention.jid.includes(owner));

    // Reply message handling
    const reply_message = m.msg?.contextInfo?.quotedMessage;
    if (reply_message) {
        m.reply_message = {
            i: true,
            message: reply_message,
            type: getContentType(reply_message),
            sender: jidNormalizedUser(m.msg?.contextInfo?.participant),
            from: m.from,
            id: m.msg?.contextInfo?.stanzaId,
            text: reply_message?.conversation || 
                  reply_message?.extendedTextMessage?.text || 
                  reply_message?.[getContentType(reply_message)]?.caption || "",
            fromMe: areJidsSameUser(m.msg?.contextInfo?.participant, sock.user.id)
        };
        m.reply_message.msg = reply_message[m.reply_message.type];
        m.reply_message.download = () => downloadMediaMessage(m.reply_message.msg);
    } else {
        m.reply_message = { i: false };
    }

    // Add utility methods
    addUtilityMethods(m, sock);
    
    return m;
}

/**
 * Add utility methods to message object
 */
function addUtilityMethods(m, sock) {
    /**
     * Send a reply message
     */
    m.send = async (content, options = {}, type = 'text') => {
        return await sendMessage(sock, m.jid, content, options, type, m);
    };

    /**
     * Reply to the current message
     */
    m.reply = async (text) => {
        return await sock.sendMessage(m.jid, { text }, { quoted: m });
    };

    /**
     * Download media from message
     */
    m.download = async () => {
        return await downloadMediaMessage(m.msg);
    };

    /**
     * Send sticker
     */
    m.sendSticker = async (jid, content, options = {}) => {
        return await sendSticker(sock, jid, content, options);
    };

    /**
     * React to message
     */
    m.react = async (emoji) => {
        return await sock.sendMessage(m.jid, {
            react: { text: emoji, key: m.key }
        });
    };

    /**
     * Edit message
     */
    m.edit = async (text) => {
        return await sock.relayMessage(m.jid, {
            protocolMessage: {
                key: m.key,
                type: 14,
                editedMessage: { conversation: text }
            }
        }, {});
    };

    /**
     * Delete message
     */
    m.delete = async () => {
        return await sock.sendMessage(m.jid, { delete: m.key });
    };
}

/**
 * Send message utility
 */
async function sendMessage(sock, jid, content, options = {}, type = 'text', quotedMessage = null) {
    const messageOptions = { ...options };
    if (quotedMessage) messageOptions.quoted = quotedMessage;

    switch (type) {
        case 'text':
            return await sock.sendMessage(jid, { 
                text: content, 
                ...messageOptions,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL 
            });
            
        case 'image':
            return await sock.sendMessage(jid, { 
                image: content, 
                ...messageOptions,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL 
            });
            
        case 'video':
            return await sock.sendMessage(jid, { 
                video: content, 
                ...messageOptions,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL 
            });
            
        case 'audio':
            return await sock.sendMessage(jid, { 
                audio: content, 
                ...messageOptions,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL 
            });
            
        case 'document':
            return await sock.sendMessage(jid, { 
                document: content, 
                ...messageOptions,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL 
            });
            
        case 'sticker':
            return await sendSticker(sock, jid, content, messageOptions);
            
        default:
            return await sock.sendMessage(jid, { 
                text: String(content), 
                ...messageOptions,
                ephemeralExpiration: WA_DEFAULT_EPHEMERAL 
            });
    }
}

/**
 * Send sticker utility
 */
async function sendSticker(sock, jid, content, options = {}) {
    const isBuffer = Buffer.isBuffer(content);
    if (!isBuffer) content = await getBuffer(content);
    
    const { mime } = await FileType.fromBuffer(content);
    
    if (mime.includes('webp')) {
        return await sock.sendMessage(jid, {
            sticker: {
                url: await writeExifWebp(content, {
                    packname: options.packname || config.STICKER_DATA.split(/[|,;]/)[0],
                    author: options.author || config.STICKER_DATA.split(/[|,;]/)[1]
                })
            },
            ...options,
            ephemeralExpiration: WA_DEFAULT_EPHEMERAL
        });
    } else if (mime.includes('image')) {
        return await sock.sendMessage(jid, {
            sticker: {
                url: await writeExifImg(content, {
                    packname: options.packname || config.STICKER_DATA.split(/[|,;]/)[0],
                    author: options.author || config.STICKER_DATA.split(/[|,;]/)[1]
                })
            },
            ...options,
            ephemeralExpiration: WA_DEFAULT_EPHEMERAL
        });
    } else if (mime.includes('video')) {
        return await sock.sendMessage(jid, {
            sticker: {
                url: await writeExifVid(content, {
                    packname: options.packname || config.STICKER_DATA.split(/[|,;]/)[0],
                    author: options.author || config.STICKER_DATA.split(/[|,;]/)[1]
                })
            },
            ...options,
            ephemeralExpiration: WA_DEFAULT_EPHEMERAL
        });
    }
}

module.exports = { serialize };