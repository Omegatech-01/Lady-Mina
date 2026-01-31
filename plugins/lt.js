import axios from 'axios';

const CONFIG = {
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/"
};

const handler = async (m, { conn }) => {
    await m.react('📑');
    const { key } = await conn.sendMessage(m.chat, { text: `📂 _Accessing Tool Manifest..._` }, { quoted: m });

    try {
        const response = await axios.get(`${CONFIG.API_URL}/rest/v1/tools?select=id,title,description,is_deleted`, {
            headers: { 
                "apikey": CONFIG.API_KEY, 
                "Referer": CONFIG.REFERER 
            }
        });

        const tools = response.data;

        if (tools.length === 0) {
            return await conn.sendMessage(m.chat, { text: "⚠️ *No Tools Found:* The directory is currently empty.", edit: key });
        }

        let report = `📂 *DENKI TOOL DIRECTORY* ✅\n`;
        report += `Total entries: ${tools.length}\n`;
        report += `──────────────────\n\n`;

        tools.forEach((tool, i) => {
            report += `*${i + 1}. ${tool.title.toUpperCase()}*\n`;
            report += `🆔 *ID:* \`${tool.id}\`\n`;
            report += `📝 *Desc:* ${tool.description}\n`;
            report += `🚫 *Deleted:* ${tool.is_deleted}\n`;
            report += `\n`;
        });

        report += `──────────────────\n_Copy the ID above to use with the .edittool command._`;

        await conn.sendMessage(m.chat, { text: report, edit: key });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *Fetch Failed:* ${e.message}`, edit: key });
    }
};

handler.help = ['listtools'];
handler.tags = ['owner'];
handler.command = /^(listtools|gettoolid|toolsdir)$/i;

export default handler;