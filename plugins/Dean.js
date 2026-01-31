import axios from 'axios';

const CONFIG = {
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/"
};

const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Usage: .edittool 1 | delete  OR  .edittool 1 | New Title | New Desc
    let [index, val1, val2] = text.split('|').map(v => v.trim());
    if (!index) return m.reply(`*Usage:* \nDelete: \`${usedPrefix + command} 1 | delete\`\nEdit: \`${usedPrefix + command} 1 | Title | Desc\``);

    try {
        // 1. Fetch current list to map index to ID
        const { data: tools } = await axios.get(`${CONFIG.API_URL}/rest/v1/tools?select=id,title`, {
            headers: { "apikey": CONFIG.API_KEY, "Referer": CONFIG.REFERER }
        });

        const targetTool = tools[parseInt(index) - 1];
        if (!targetTool) return m.reply("❌ Invalid Tool Number. Run `.listtools` to see the current list.");

        const toolId = targetTool.id;

        if (val1.toLowerCase() === 'delete') {
            // Delete Logic
            await axios.patch(`${CONFIG.API_URL}/rest/v1/tools?id=eq.${toolId}`, { is_deleted: true }, {
                headers: { "apikey": CONFIG.API_KEY, "Content-Type": "application/json" }
            });
            return m.reply(`🗑️ *TOOL DELETED*\n"${targetTool.title}" has been hidden from the UI.`);
        } else {
            // Edit Logic
            await axios.patch(`${CONFIG.API_URL}/rest/v1/tools?id=eq.${toolId}`, {
                title: val1,
                description: val2 || "No description provided",
                updated_at: new Date().toISOString()
            }, { headers: { "apikey": CONFIG.API_KEY, "Content-Type": "application/json" } });
            return m.reply(`✅ *TOOL UPDATED*\nNew Title: ${val1}`);
        }
    } catch (e) {
        m.reply(`❌ *Error:* ${e.message}`);
    }
};

handler.help = ['edittool'];
handler.tags = ['owner'];
handler.command = /^(edittool)$/i;
export default handler;