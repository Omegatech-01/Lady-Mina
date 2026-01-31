import axios from 'axios';

const CONFIG = {
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/"
};

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const headers = { "apikey": CONFIG.API_KEY, "Referer": CONFIG.REFERER };

    // COMMAND: .withdraws (List all)
    if (command === 'withdraws') {
        await m.react('💸');
        try {
            const { data: reqs } = await axios.get(`${CONFIG.API_URL}/rest/v1/withdrawals?select=*&order=created_at.desc`, { headers });
            if (reqs.length === 0) return m.reply("📭 No withdrawal requests found.");

            let txt = `💰 *PENDING WITHDRAWALS* 💰\n\n`;
            reqs.forEach((r, i) => {
                txt += `*${i + 1}.* ID: \`${r.id.slice(0,8)}\`\n`;
                txt += `👤 User: \`${r.user_id.slice(0,8)}\`\n`;
                txt += `💵 Amount: ${r.amount}\n`;
                txt += `📑 Status: *${r.status}*\n`;
                txt += `──────────────────\n`;
            });
            txt += `\nTo approve, use: \`${usedPrefix}approve 1\``;
            return m.reply(txt);
        } catch (e) { return m.reply(`❌ Error: ${e.message}`); }
    }

    // COMMAND: .approve <index>
    if (command === 'approve') {
        const index = parseInt(text);
        if (isNaN(index)) return m.reply(`*Usage:* ${usedPrefix}approve 1`);

        try {
            const { data: reqs } = await axios.get(`${CONFIG.API_URL}/rest/v1/withdrawals?select=id&order=created_at.desc`, { headers });
            const target = reqs[index - 1];
            if (!target) return m.reply("❌ Request not found.");

            await axios.patch(`${CONFIG.API_URL}/rest/v1/withdrawals?id=eq.${target.id}`, { 
                status: 'approved', // Or 'completed' / 'paid' depending on the app
                updated_at: new Date().toISOString() 
            }, { headers: { ...headers, "Content-Type": "application/json" } });

            m.reply(`✅ *SUCCESS:* Withdrawal \`${target.id.slice(0,8)}\` approved.`);
        } catch (e) { m.reply(`❌ Error: ${e.message}`); }
    }
};

handler.help = ['withdraws', 'approve'];
handler.tags = ['owner'];
handler.command = /^(withdraws|approve)$/i;
export default handler;