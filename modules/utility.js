/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Utility Module
*/

const { getJson } = require("../utils/helpers");
const config = require("../config");

module.exports = {
    info: {
        name: "Utility Commands",
        description: "Useful utility commands for everyday tasks",
        version: "1.0.0",
        category: "utility"
    },

    commands: [
        {
            pattern: "weather",
            desc: "Get weather information",
            usage: "weather <city_name>",
            fromMe: false,
            function: async (message, match) => {
                match = match || message.reply_message?.text;
                if (!match) {
                    return await message.send('🌤️ *Please provide a city name*\nExample: `weather London`');
                }

                try {
                    const data = await getJson(`${config.BASE_URL}api/weather?city=${encodeURIComponent(match)}&apikey=${config.API_KEY}`);
                    
                    if (!data.status) {
                        return await message.send('❌ *Weather data not found*');
                    }

                    const weather = data.result;
                    const weatherText = `🌤️ *Weather in ${weather.location}*\n\n` +
                        `🌡️ *Temperature:* ${weather.temperature}°C\n` +
                        `📝 *Description:* ${weather.description}\n` +
                        `💨 *Wind Speed:* ${weather.windSpeed} km/h\n` +
                        `💧 *Humidity:* ${weather.humidity}%\n` +
                        `👁️ *Visibility:* ${weather.visibility} km\n` +
                        `🌅 *Sunrise:* ${weather.sunrise}\n` +
                        `🌇 *Sunset:* ${weather.sunset}`;

                    return await message.send(weatherText);
                } catch (error) {
                    return await message.send('❌ *Failed to fetch weather data*');
                }
            }
        },

        {
            pattern: "qr",
            desc: "Generate or read QR code",
            usage: "qr <text> or reply to QR image",
            fromMe: false,
            function: async (message, match) => {
                if (message.reply_message?.image) {
                    // Read QR code
                    try {
                        const imgBuffer = await message.reply_message.download();
                        const FormData = require('form-data');
                        const form = new FormData();
                        form.append("file", imgBuffer, "qr.png");

                        const response = await require('axios').post(`${config.BASE_URL}qr-reader?apikey=${config.API_KEY}`, form, {
                            headers: form.getHeaders()
                        });

                        const result = response.data?.result;
                        if (!result) {
                            return await message.send('❌ *Could not read QR code*');
                        }

                        return await message.send(`✅ *QR Content:*\n\`\`\`${result}\`\`\``);
                    } catch (error) {
                        return await message.send('❌ *Error reading QR code*');
                    }
                } else {
                    // Generate QR code
                    match = match || message.reply_message?.text;
                    if (!match) {
                        return await message.send('📱 *Provide text to generate QR code or reply to QR image to read*');
                    }

                    try {
                        const qrUrl = `${config.BASE_URL}qrcode?text=${encodeURIComponent(match)}&apikey=${config.API_KEY}`;
                        return await message.send({ url: qrUrl }, {
                            caption: `📱 *QR Code for:* \`\`\`${match}\`\`\``
                        }, 'image');
                    } catch (error) {
                        return await message.send('❌ *Error generating QR code*');
                    }
                }
            }
        },

        {
            pattern: "calc",
            desc: "Calculate mathematical expressions",
            usage: "calc <expression>",
            fromMe: false,
            function: async (message, match) => {
                match = match || message.reply_message?.text;
                if (!match) {
                    return await message.send('🧮 *Provide a mathematical expression*\nExample: `calc 2+2*3`');
                }

                try {
                    // Simple calculator using eval (be careful with this in production)
                    const expression = match.replace(/[^0-9+\-*/.() ]/g, '');
                    if (!expression) {
                        return await message.send('❌ *Invalid mathematical expression*');
                    }

                    const result = eval(expression);
                    return await message.send(`🧮 *Calculator*\n\n📝 *Expression:* ${match}\n✅ *Result:* ${result}`);
                } catch (error) {
                    return await message.send('❌ *Invalid mathematical expression*');
                }
            }
        },

        {
            pattern: "translate",
            desc: "Translate text to different languages",
            usage: "translate <lang_code> (reply to text)",
            fromMe: false,
            function: async (message, match) => {
                if (!message.reply_message?.text) {
                    return await message.send('📝 *Reply to a text message to translate*');
                }

                if (!match) {
                    return await message.send('🌐 *Provide language code*\nExample: `translate en` (for English)');
                }

                try {
                    const { translate } = require('@vitalets/google-translate-api');
                    const result = await translate(message.reply_message.text, { to: match });
                    
                    const translatedText = `🌐 *Translation*\n\n` +
                        `📝 *Original:* ${message.reply_message.text}\n` +
                        `🔤 *From:* ${result.from.language.iso}\n` +
                        `🔤 *To:* ${match}\n` +
                        `✅ *Result:* ${result.text}`;

                    return await message.send(translatedText);
                } catch (error) {
                    return await message.send('❌ *Translation failed*');
                }
            }
        },

        {
            pattern: "shorturl",
            desc: "Shorten long URLs",
            usage: "shorturl <url>",
            fromMe: false,
            function: async (message, match) => {
                match = match || message.reply_message?.text;
                if (!match || !match.startsWith('http')) {
                    return await message.send('🔗 *Provide a valid URL to shorten*');
                }

                try {
                    const data = await getJson(`${config.BASE_URL}api/tools/shorturl?url=${encodeURIComponent(match)}&apikey=${config.API_KEY}`);
                    
                    if (!data.status) {
                        return await message.send('❌ *Failed to shorten URL*');
                    }

                    return await message.send(`🔗 *URL Shortened*\n\n📝 *Original:* ${match}\n✅ *Short URL:* ${data.result}`);
                } catch (error) {
                    return await message.send('❌ *URL shortening failed*');
                }
            }
        }
    ]
};