import axios from 'axios';

const CONFIG = {
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/"
};

const headers = {
    "accept": "*/*",
    "apikey": CONFIG.API_KEY,
    "content-type": "application/json",
    "Referer": CONFIG.REFERER
};

const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Input check: .setcoins email | amount
    let [target, amount] = text.split('|').map(v => v.trim());

    if (!target || !amount || isNaN(amount)) {
        return m.reply(`*⚠️ FORMAT ERROR*\n\nUsage: \`${usedPrefix + command} email | amount\`\nExample: \`${usedPrefix + command} TechGod@gmail.com | 50000\``);
    }

    await m.react('🔧');
    const { key } = await conn.sendMessage(m.chat, { text: `📡 _Searching for node: ${target}..._` }, { quoted: m });

    try {
        // 1. GET ALL PROFILES FIRST (Most reliable way to avoid 400 error)
        const allProfiles = await axios.get(
            `${CONFIG.API_URL}/rest/v1/profiles?select=*`,
            { headers }
        );

        const users = allProfiles.data || [];
        
        // 2. SEARCH LOCALLY (Avoids complex SQL filters that cause 400s)
        const targetUser = users.find(u => 
            (u.email && u.email.toLowerCase() === target.toLowerCase()) || 
            (u.username && u.username.toLowerCase() === target.toLowerCase()) ||
            (u.user_id && u.user_id.includes(target))
        );

        if (!targetUser) {
            return await conn.sendMessage(m.chat, { text: `❌ *User Not Found:* No identity matches "${target}" in the system records.`, edit: key });
        }

        const userId = targetUser.user_id;
        const oldBal = targetUser.coins || 0;

        // 3. APPLY PATCH
        await axios.patch(
            `${CONFIG.API_URL}/rest/v1/profiles?user_id=eq.${userId}`,
            { coins: parseInt(amount) },
            { headers }
        ).catch(e => { throw new Error(`Patch Rejected: ${e.response?.statusText || e.message}`) });

        // 4. SUCCESS REPORT
        let report = `⚙️ *SYSTEM MODIFICATION COMPLETE* ✅\n\n`;
        report += `👤 *Identity:* ${targetUser.email || targetUser.username || 'Unknown'}\n`;
        report += `🆔 *UUID:* \`${userId.slice(0, 8)}...\`\n`;
        report += `📉 *Previous:* ${oldBal.toLocaleString()}\n`;
        report += `📈 *Current:* ${parseInt(amount).toLocaleString()}\n\n`;
        report += `_Status: Database Synced_`;

        await conn.sendMessage(m.chat, { 
            text: report,
            edit: key,
            contextInfo: {
                externalAdReply: {
                    title: `OMEGATECH CORE MODIFIER ✅`,
                    body: `Target Verified: ${target}`,
                    mediaType: 1,
                    showAdAttribution: true
                },
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363243543411475@newsletter',
                    newsletterName: `OmegaTech Core ✅`,
                }
            }
        });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *Terminal Error:* ${e.message}`, edit: key });
    }
};

handler.help = ['setcoins'];
handler.tags = ['owner'];
handler.command = /^(setcoins|modcoins|editbal)$/i;

export default handler;