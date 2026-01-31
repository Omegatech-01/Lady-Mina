import axios from 'axios';

const CONFIG = {
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/"
};

const handler = async (m, { conn, text }) => {
    // Usage: .social tool_id | Great tool! | I love this | Amazing
    let parts = text.split('|').map(v => v.trim());
    let toolId = parts[0];
    let comments = parts.slice(1);

    if (!toolId || comments.length === 0) {
        return m.reply("*Usage:* .social tool_id | comment 1 | comment 2 | comment 3");
    }

    await m.react('🎭');
    const { key } = await conn.sendMessage(m.chat, { text: `🚀 _Launching Social Storm on Tool: ${toolId.slice(0,8)}..._` }, { quoted: m });

    try {
        // 1. Get a list of existing User IDs to act as "Ghost Bots"
        const { data: users } = await axios.get(`${CONFIG.API_URL}/rest/v1/profiles?limit=${comments.length}`, {
            headers: { "apikey": CONFIG.API_KEY, "Referer": CONFIG.REFERER }
        });

        let successCount = 0;

        for (let i = 0; i < comments.length; i++) {
            const botId = users[i]?.user_id || users[0].user_id; // Fallback to first user
            const commentText = comments[i];

            // A. Inject Like
            await axios.post(`${CONFIG.API_URL}/rest/v1/likes`, {
                user_id: botId,
                tool_id: toolId
            }, { headers: { "apikey": CONFIG.API_KEY, "Content-Type": "application/json", "Referer": CONFIG.REFERER } }).catch(() => {});

            // B. Inject Comment
            await axios.post(`${CONFIG.API_URL}/rest/v1/comments`, {
                user_id: botId,
                tool_id: toolId,
                content: commentText // Adjust this to 'text' or 'message' if it fails
            }, { headers: { "apikey": CONFIG.API_KEY, "Content-Type": "application/json", "Referer": CONFIG.REFERER } }).catch(() => {});
            
            successCount++;
        }

        await conn.sendMessage(m.chat, { 
            text: `🔥 *SOCIAL STORM COMPLETE* 🔥\n\n✅ *Interactions:* ${successCount}\n💬 *Comments Injected:* ${comments.length}\n❤️ *Likes Injected:* ${successCount}\n\n_Note: If comments don't show, we may need to .blueprint comments to check the column name._`, 
            edit: key 
        });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *Storm Failed:* ${e.message}`, edit: key });
    }
};

handler.help = ['social'];
handler.tags = ['owner'];
handler.command = /^(social|storm)$/i;

export default handler;