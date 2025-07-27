/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Group Module
*/

const { groupDB } = require("../core/database");

module.exports = {
    info: {
        name: "Group Management",
        description: "Commands for managing WhatsApp groups",
        version: "1.0.0",
        category: "group"
    },

    commands: [
        {
            pattern: "promote",
            desc: "Promote user to admin",
            usage: "promote (reply to user)",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }
                
                if (!message.reply_message?.sender) {
                    return await message.send('👤 *Reply to a user to promote*');
                }

                try {
                    await message.client.groupParticipantsUpdate(
                        message.jid,
                        [message.reply_message.sender],
                        "promote"
                    );
                    
                    return await message.send(
                        `✅ *@${message.reply_message.sender.split('@')[0]} promoted to admin*`,
                        { mentions: [message.reply_message.sender] }
                    );
                } catch (error) {
                    return await message.send('❌ *Failed to promote user*');
                }
            }
        },

        {
            pattern: "demote",
            desc: "Demote admin to member",
            usage: "demote (reply to user)",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }
                
                if (!message.reply_message?.sender) {
                    return await message.send('👤 *Reply to a user to demote*');
                }

                try {
                    await message.client.groupParticipantsUpdate(
                        message.jid,
                        [message.reply_message.sender],
                        "demote"
                    );
                    
                    return await message.send(
                        `✅ *@${message.reply_message.sender.split('@')[0]} demoted from admin*`,
                        { mentions: [message.reply_message.sender] }
                    );
                } catch (error) {
                    return await message.send('❌ *Failed to demote user*');
                }
            }
        },

        {
            pattern: "kick",
            desc: "Remove user from group",
            usage: "kick (reply to user)",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }
                
                let user = message.reply_message?.sender || match;
                if (!user) {
                    return await message.send('👤 *Reply to a user or provide number*');
                }

                user = user.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

                try {
                    await message.client.groupParticipantsUpdate(
                        message.jid,
                        [user],
                        "remove"
                    );
                    
                    return await message.send(
                        `✅ *@${user.split('@')[0]} removed from group*`,
                        { mentions: [user] }
                    );
                } catch (error) {
                    return await message.send('❌ *Failed to remove user*');
                }
            }
        },

        {
            pattern: "add",
            desc: "Add user to group",
            usage: "add <number> or reply to user",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }
                
                let user = message.reply_message?.sender || match;
                if (!user) {
                    return await message.send('👤 *Reply to a user or provide number*');
                }

                user = user.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

                try {
                    const info = await message.client.onWhatsApp(user);
                    if (!info?.[0]?.exists) {
                        return await message.send('❌ *User not found on WhatsApp*');
                    }

                    const result = await message.client.groupParticipantsUpdate(
                        message.jid,
                        [user],
                        "add"
                    );

                    if (result[0].status === 403) {
                        await message.send('📨 *Couldn\'t add. Sending invite...*');
                        const code = await message.client.groupInviteCode(message.jid);
                        return await message.client.sendMessage(user, {
                            text: `🔗 *Group Invite*\nhttps://chat.whatsapp.com/${code}`
                        });
                    } else if (result[0].status === 200) {
                        return await message.send(
                            `✅ *@${user.split('@')[0]} added to group*`,
                            { mentions: [user] }
                        );
                    } else if (result[0].status === 409) {
                        return await message.send('ℹ️ *User already in group*');
                    } else {
                        return await message.send('❌ *Failed to add user*');
                    }
                } catch (error) {
                    return await message.send('❌ *Failed to add user*');
                }
            }
        },

        {
            pattern: "mute",
            desc: "Mute group (admins only)",
            usage: "mute",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }

                try {
                    await message.client.groupSettingUpdate(message.jid, 'announcement');
                    return await message.send('🔇 *Group muted - Only admins can send messages*');
                } catch (error) {
                    return await message.send('❌ *Failed to mute group*');
                }
            }
        },

        {
            pattern: "unmute",
            desc: "Unmute group",
            usage: "unmute",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }

                try {
                    await message.client.groupSettingUpdate(message.jid, 'not_announcement');
                    return await message.send('🔊 *Group unmuted - All members can send messages*');
                } catch (error) {
                    return await message.send('❌ *Failed to unmute group*');
                }
            }
        },

        {
            pattern: "gname",
            desc: "Change group name",
            usage: "gname <new_name>",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }
                
                if (!match) {
                    return await message.send('📝 *Provide new group name*');
                }

                try {
                    await message.client.groupUpdateSubject(message.jid, match);
                    return await message.send(`✅ *Group name changed to: ${match}*`);
                } catch (error) {
                    return await message.send('❌ *Failed to change group name*');
                }
            }
        },

        {
            pattern: "gdesc",
            desc: "Change group description",
            usage: "gdesc <new_description>",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }

                try {
                    await message.client.groupUpdateDescription(message.jid, match || '');
                    return await message.send('✅ *Group description updated*');
                } catch (error) {
                    return await message.send('❌ *Failed to update description*');
                }
            }
        },

        {
            pattern: "invite",
            desc: "Get group invite link",
            usage: "invite",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }

                try {
                    const code = await message.client.groupInviteCode(message.jid);
                    return await message.send(`🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}`);
                } catch (error) {
                    return await message.send('❌ *Failed to get invite link*');
                }
            }
        },

        {
            pattern: "revoke",
            desc: "Revoke group invite link",
            usage: "revoke",
            fromMe: true,
            onlyGroup: true,
            function: async (message, match) => {
                if (!await isBotAdmin(message)) {
                    return await message.send('❌ *Bot must be admin first*');
                }

                try {
                    await message.client.groupRevokeInvite(message.jid);
                    return await message.send('✅ *Group invite link revoked*');
                } catch (error) {
                    return await message.send('❌ *Failed to revoke invite link*');
                }
            }
        }
    ]
};

// Helper function to check if bot is admin
async function isBotAdmin(message) {
    if (!message.isGroup) return false;
    try {
        const metadata = await message.client.groupMetadata(message.jid);
        const admins = metadata.participants.filter(v => v.admin).map(v => v.id);
        return admins.includes(message.client.user.id);
    } catch {
        return false;
    }
}