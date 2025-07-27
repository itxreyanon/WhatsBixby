/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Media Module
*/

const { toAudio, toPTT } = require("../utils/media");
const { writeExifImg, writeExifVid, writeExifWebp } = require("../utils/media/sticker");
const config = require("../config");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

module.exports = {
    info: {
        name: "Media Commands",
        description: "Media conversion and manipulation commands",
        version: "1.0.0",
        category: "media"
    },

    commands: [
        {
            pattern: "sticker",
            desc: "Convert image/video to sticker",
            usage: "sticker (reply to image/video)",
            fromMe: false,
            function: async (message, match) => {
                if (!message.reply_message?.image && !message.reply_message?.video && !message.image && !message.video) {
                    return await message.send('📎 *Reply to an image or video to convert to sticker*');
                }

                try {
                    const media = message.reply_message?.image || message.reply_message?.video || message.image || message.video;
                    const download = await message.download();
                    
                    return await message.sendSticker(message.jid, download, {
                        packname: config.STICKER_DATA.split(/[|;,]/)[0] || "AstraWa",
                        author: config.STICKER_DATA.split(/[|;,]/)[1] || "Codex"
                    });
                } catch (error) {
                    return await message.send('❌ *Failed to create sticker*');
                }
            }
        },

        {
            pattern: "photo",
            desc: "Convert sticker to image",
            usage: "photo (reply to sticker)",
            fromMe: false,
            function: async (message, match) => {
                if (!message.reply_message?.sticker) {
                    return await message.send('📎 *Reply to a sticker to convert to image*');
                }

                try {
                    const media = await message.reply_message.download();
                    const outputPath = './media/temp/photo.png';
                    
                    await new Promise((resolve, reject) => {
                        ffmpeg(media)
                            .fromFormat('webp_pipe')
                            .save(outputPath)
                            .on('error', reject)
                            .on('end', resolve);
                    });

                    const result = fs.readFileSync(outputPath);
                    fs.unlinkSync(outputPath);
                    
                    return await message.send(result, {}, 'image');
                } catch (error) {
                    return await message.send('❌ *Failed to convert sticker to image*');
                }
            }
        },

        {
            pattern: "mp3",
            desc: "Convert video to audio",
            usage: "mp3 (reply to video/audio)",
            fromMe: false,
            function: async (message, match) => {
                if (!message.reply_message?.video && !message.reply_message?.audio) {
                    return await message.send('📎 *Reply to a video or audio file*');
                }

                try {
                    const media = await message.reply_message.download();
                    const audioBuffer = await toAudio(media);
                    
                    return await message.send(audioBuffer, { 
                        mimetype: 'audio/mpeg',
                        fileName: 'audio.mp3'
                    }, 'audio');
                } catch (error) {
                    return await message.send('❌ *Failed to convert to MP3*');
                }
            }
        },

        {
            pattern: "voice",
            desc: "Convert audio to voice note",
            usage: "voice (reply to audio)",
            fromMe: false,
            function: async (message, match) => {
                if (!message.reply_message?.audio && !message.reply_message?.video) {
                    return await message.send('📎 *Reply to an audio or video file*');
                }

                try {
                    const media = await message.reply_message.download();
                    const voiceBuffer = await toPTT(media);
                    
                    return await message.send(voiceBuffer, {
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    }, 'audio');
                } catch (error) {
                    return await message.send('❌ *Failed to convert to voice note*');
                }
            }
        },

        {
            pattern: "doc",
            desc: "Convert media to document",
            usage: "doc [filename] (reply to media)",
            fromMe: false,
            function: async (message, match) => {
                if (!message.reply_message?.image && !message.reply_message?.video && !message.reply_message?.audio) {
                    return await message.send('📎 *Reply to a media file*');
                }

                try {
                    const media = await message.reply_message.download();
                    const fileName = match || 'document';
                    const { mime } = await require('file-type').fromBuffer(media);
                    const ext = mime.split('/')[1];
                    
                    return await message.send(media, {
                        fileName: `${fileName}.${ext}`,
                        mimetype: mime
                    }, 'document');
                } catch (error) {
                    return await message.send('❌ *Failed to convert to document*');
                }
            }
        }
    ]
};