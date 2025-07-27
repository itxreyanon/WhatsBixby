/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Greetings
*/

const os = require("os");
const config = require("../../config");
const { extractUrlsFromString } = require("./index");

async function greetings(m, conn, { welcome, exit }) {
    if (!exit && !welcome) return;
    
    try {
        if (m.action === 'add') {
            if (!welcome || welcome.status === 'false' || !welcome.message) return;
            return await sendGreeting(m, conn, welcome.message);
        } else if (m.action === 'remove') {
            if (!exit || exit.status === 'false' || !exit.message) return;
            return await sendGreeting(m, conn, exit.message);
        }
    } catch (err) {
        console.log('Greeting error:', err);
    }
}

async function sendGreeting(m, conn, text) {
    if (m.id === "120363040291283569@g.us" && conn.user.number !== "91705099154") return;
    
    let { id, subject, desc, size, participants } = await conn.groupMetadata(m.id);
    let admins = participants.filter(v => v.admin !== null).map(v => v.id).length;
    
    let msg = { contextInfo: {} };
    let extractions = text.match(/#(.*?)#/g);
    let URL;
    
    if (extractions) {
        text = text.replace(/#(.*?)#/g, '');
        extractions = extractions.map(m => m.slice(1, -1));
        URL = extractUrlsFromString(text)?.[0];
        
        msg.contextInfo.externalAdReply = {
            containsAutoReply: true,
            mediaType: 1,
            previewType: "PHOTO"
        };
        
        // Process extractions for link preview
        extractions.forEach(extraction => {
            extraction = extraction.replace('\\', '');
            if (extraction.match(/adattribution/gi)) msg.contextInfo.externalAdReply.showAdAttribution = true;
            if (extraction.match(/largerthumbnail/gi)) msg.contextInfo.externalAdReply.renderLargerThumbnail = true;
            if (extraction.match(/title/gi)) msg.contextInfo.externalAdReply.title = extraction.replace(/title/gi, '');
            if (extraction.match(/body/gi)) msg.contextInfo.externalAdReply.body = extraction.replace(/body/gi, '');
            if (extraction.match(/thumbnail/gi)) msg.contextInfo.externalAdReply.thumbnailUrl = extraction.replace(/thumbnail/gi, '');
            if (extraction.match(/sourceurl/gi)) msg.contextInfo.externalAdReply.sourceUrl = extraction.replace(/sourceurl/gi, '');
        });
    } else {
        URL = extractUrlsFromString(text)?.[0];
    }
    
    let date = new Date().toLocaleDateString("EN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    
    const platform = os.platform();
    
    if (text.includes('&mention')) msg.contextInfo.mentionedJid = m.participants;
    
    text = text
        .replace(/&version/gi, require('../../package.json').version)
        .replace(/&jid/gi, id)
        .replace(/&gname/gi, subject)
        .replace(/&mode/gi, config.WORKTYPE)
        .replace(/&desc/gi, desc)
        .replace(/&size/gi, size)
        .replace(/&admins/gi, admins)
        .replace(/&platform/gi, platform)
        .replace(/&mention/gi, `@${m.participants[0].replace(/[^0-9]/g, '')}`)
        .replace(/&date/gi, date);
    
    if (text.includes('&gif')) {
        msg.gifPlayback = true;
        text = text.replace(/&gif/g, '');
    }
    
    if (URL && URL.endsWith('.mp4')) {
        msg.video = { url: URL };
        msg.caption = text.replace(URL, '').trim();
    } else if (URL) {
        msg.image = { url: URL };
        msg.caption = text.replace(URL, '').trim();
    } else if (text.includes('&pp') && !text.includes('&gpp')) {
        text = text.replace(/&pp/g, '');
        try {
            msg.image = { url: await conn.profilePictureUrl(m.participants[0], 'image') };
        } catch (e) {
            msg.image = { url: "https://i.ibb.co/sFjZh7S/6883ac4d6a92.jpg" };
        }
        msg.caption = text.trim();
    } else if (text.includes('&gpp')) {
        text = text.replace(/&gpp/g, '');
        try {
            msg.image = { url: await conn.profilePictureUrl(m.id, 'image') };
        } catch (e) {
            msg.image = { url: "https://i.ibb.co/sFjZh7S/6883ac4d6a92.jpg" };
        }
        msg.caption = text.trim();
    } else {
        msg.text = text.trim();
    }
    
    return await conn.sendMessage(m.id, msg);
}

module.exports = greetings;