/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Downloader Module
*/

const { getJson, extractUrlsFromString, isUrl } = require("../utils/helpers");
const config = require("../config");

module.exports = {
    info: {
        name: "Downloader Commands",
        description: "Download media from various platforms",
        version: "1.0.0",
        category: "downloader"
    },

    commands: [
        {
            pattern: "ytv",
            desc: "Download YouTube video",
            usage: "ytv <youtube_url>",
            fromMe: false,
            function: async (message, match) => {
                match = match || message.reply_message?.text;
                
                if (!match || !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(match)) {
                    return await message.send('🎥 *Please provide a valid YouTube URL*\nExample: `.ytv https://youtu.be/...`');
                }

                try {
                    await message.send('⬇️ *Processing your video...*');

                    const { data } = await require('axios').get(`https://codexnet.xyz/ytv?url=${encodeURIComponent(match)}&apikey=L5Ce7iyZng`);
                    const result = data?.result;
                    
                    if (!result?.success || !result?.download_url) {
                        return await message.send('❌ *Failed to retrieve download link*');
                    }

                    return await message.send(
                        { url: result.download_url },
                        {
                            mimetype: 'video/mp4',
                            caption: `🎬 *${result.title || 'YouTube Video'}*\n👤 ${result.author || 'Unknown'}\n📦 ${result.size_mb} MB`
                        },
                        'video'
                    );
                } catch (error) {
                    return await message.send('❌ *An error occurred while downloading the video*');
                }
            }
        },

        {
            pattern: "insta",
            desc: "Download Instagram media",
            usage: "insta <instagram_url>",
            fromMe: false,
            function: async (message, match) => {
                if (match.startsWith('dl-url:')) {
                    const url = match.replace(/dl-url:/, '').replace("INSTAGRAM DOWNLOADER", '').trim();
                    return await message.send({ url }, {}, 'video');
                }

                match = match || message.reply_message?.text;
                if (!match) return await message.send('📸 *Please provide an Instagram URL*');

                const urls = extractUrlsFromString(match);
                if (!urls?.[0] || !urls[0].includes('instagram.com')) {
                    return await message.send('❌ *Please provide a valid Instagram URL*');
                }

                try {
                    const data = await getJson(`${config.BASE_URL}api/download/insta?apikey=${config.API_KEY}&url=${urls[0]}`);
                    
                    if (!data.status) {
                        return await message.send(`❌ *API key limit exceeded*\nGet a new key: ${config.BASE_URL}api/signup`);
                    }

                    const { result } = data;
                    if (!result?.[0]) return await message.send('❌ *No media found*');

                    if (result.length === 1) {
                        return await message.send({ url: result[0].url }, {}, 'video');
                    }

                    // Multiple media - create poll
                    const options = result.map((item, index) => ({
                        name: `${index + 1}/${result.length}`,
                        id: `insta dl-url:${item.url}`
                    }));

                    return await message.send({
                        name: "INSTAGRAM DOWNLOADER",
                        values: options.slice(0, 10),
                        withPrefix: true,
                        onlyOnce: false,
                        participates: [message.sender],
                        selectableCount: true
                    }, {}, 'poll');
                } catch (error) {
                    return await message.send('❌ *Failed to download Instagram media*');
                }
            }
        },

        {
            pattern: "apk",
            desc: "Download APK from Aptoide",
            usage: "apk <app_name>",
            fromMe: false,
            function: async (message, match) => {
                if (match.startsWith('dl-id:')) {
                    const appId = match.replace(/dl-id:/, '').replace('APK DOWNLOADER', '').trim();
                    
                    try {
                        const response = await require('axios').get(`${config.BASE_URL}download/aptoide?apk=${encodeURIComponent(appId)}&apikey=${config.API_KEY}`);
                        
                        if (!response.data?.status) {
                            return await message.send('❌ *Failed to download APK*');
                        }

                        return await message.send(
                            { url: response.data.result.link },
                            {
                                mimetype: "application/vnd.android.package-archive",
                                fileName: response.data.result.name + ".apk"
                            },
                            'document'
                        );
                    } catch (error) {
                        return await message.send('❌ *Download failed*');
                    }
                }

                match = match || message.reply_message?.text;
                if (!match) return await message.send('📱 *Please provide an app name*');

                try {
                    const response = await require('axios').get(`${config.BASE_URL}search/aptoide?apk=${encodeURIComponent(match)}&apikey=${config.API_KEY}`);
                    
                    if (!response.data?.status) {
                        return await message.send(`❌ *API key limit exceeded*\nGet a new key: ${config.BASE_URL}api/signup`);
                    }

                    const results = response.data.result.slice(0, 10).map(app => ({
                        name: `${app.name} (${app.id})`,
                        id: `apk dl-id:${app.id}`
                    }));

                    return await message.send({
                        name: '📲 APK DOWNLOADER',
                        values: results,
                        withPrefix: true,
                        onlyOnce: true,
                        participates: [message.sender],
                        selectableCount: true
                    }, {}, 'poll');
                } catch (error) {
                    return await message.send('❌ *Search failed*');
                }
            }
        }
    ]
};