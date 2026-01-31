/**
 * Group Hijack Plugin (Lady-Trish Edition)
 * Author: OmegaTech
 * Version: 2.2 (Commander-Safe Edition)
 */

import axios from 'axios';

let handler = async (m, { conn, participants, isBotAdmin, isAdmin, isOwner }) => {
    // Only the true Boss or an Admin can trigger this
    if (!isAdmin && !isOwner) return global.dfail('admin', m, conn);
    if (!isBotAdmin) return m.reply('🤖 I need to be **Admin** to seize control, darling.');

    await m.reply('`[ LADY-TRISH TAKEOVER INITIATED... ]` ⚡');

    try {
        const botJid = conn.user.jid;
        const senderJid = m.sender; // This is YOU

        // 1. STRIP POWER: Demote admins EXCEPT you and the bot
        const adminJids = participants
            .filter(p => 
                (p.admin === 'admin' || p.admin === 'superadmin') && 
                p.id !== botJid && 
                p.id !== senderJid // THE FIX: Excludes the person who sent the command
            )
            .map(p => p.id);

        if (adminJids.length > 0) {
            for (let jid of adminJids) {
                try {
                    // One by one to handle the "Not Authorized" creator protection
                    await conn.groupParticipantsUpdate(m.chat, [jid], 'demote');
                } catch {
                    continue; 
                }
            }
            await m.reply(`✅ Admins processed. You and I remain in power. 🔥`);
        } else {
            await m.reply(`⚠️ No other admins found to demote.`);
        }

        // 2. SEAL THE GATES
        await conn.groupSettingUpdate(m.chat, 'announcement').catch(() => {});

        // 3. REBRAND
        const newName = 'ʜɪᴊᴀᴄᴋᴇᴅ ʙʏ ʟᴀᴅʏ-ᴛʀɪsʜ 🔥';
        const newDesc = `🔥 ᴛʜɪs ɢʀᴏᴜᴘ ɪs ɴᴏᴡ ᴜɴᴅᴇʀ ᴛʜᴇ ʀᴇɪɢɴ ᴏғ ʟᴀᴅʏ-ᴛʀɪsʜ 🔥\nᴀʟʟ ᴘᴏᴡᴇʀ ᴛᴏ ᴛʜᴇ ʜɪᴊᴀᴄᴋᴇʀ! 🌟\n\nᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴏᴍᴇɢᴀᴛᴇᴄʜ\nsᴜᴘᴘᴏʀᴛ: https://github.com/Omegatech-01`.trim();

        await conn.groupUpdateSubject(m.chat, newName).catch(() => {});
        await conn.groupUpdateDescription(m.chat, newDesc).catch(() => {});

        // 4. IDENTITY (Profile Picture)
        try {
            const ppUrl = 'https://files.catbox.moe/3b6dsq.png';
            const response = await axios.get(ppUrl, { responseType: 'arraybuffer' });
            await conn.updateProfilePicture(m.chat, response.data);
        } catch (e) {
            console.log("PP update skipped.");
        }

        await m.reply(`
👑 *TAKEOVER COMPLETE*
────────────────────
ᴛʜɪs ɢʀᴏᴜᴘ ʜᴀs ʙᴇᴇɴ sᴜᴄᴄᴇssғᴜʟʟʏ ᴄʟᴀɪᴍᴇᴅ. 

🌟 *Owner:* OmegaTech
🤖 *System:* Lady-Trish Engine
`.trim());

    } catch (err) {
        console.error(err);
        m.reply(`❌ *System Failure:* ${err.message}`);
    }
};

handler.help = ['hijack'];
handler.tags = ['group'];
handler.command = /^(hijack|👁|👨‍💻)$/i;
handler.group = true;
handler.botAdmin = true;

export default handler;