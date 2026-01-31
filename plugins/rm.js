import axios from "axios";
import * as cheerio from "cheerio";

const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Expected usage: .zefoy <url> | <PHPSESSID>
    const input = text.split('|').map(v => v.trim());
    const url = input[0];
    const phpsessid = input[1];

    if (!url || !phpsessid) {
        return m.reply(`*Usage:* ${usedPrefix + command} video_url | PHPSESSID\n\n*How to get PHPSESSID:* \n1. Open zefoy.com on Chrome/Kiwi Browser.\n2. Solve Captcha.\n3. Open DevTools > Application > Cookies.\n4. Copy 'PHPSESSID' value.`);
    }

    await m.react('🧊');
    const { key } = await conn.sendMessage(m.chat, { text: `🧊 *ZEFOY: INJECTING SESSION...*` }, { quoted: m });

    try {
        const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
        
        const headers = {
            "Cookie": `PHPSESSID=${phpsessid}`,
            "User-Agent": UA,
            "X-Requested-With": "XMLHttpRequest",
            "Origin": "https://zefoy.com",
            "Referer": "https://zefoy.com/"
        };

        // 1. VERIFY SESSION (Checking if session is still alive)
        const check = await axios.get("https://zefoy.com/", { headers });
        if (check.data.includes("re-login") || check.data.includes("Enter Video URL")) {
            // If the page loads the search box, the session is valid!
            await conn.sendMessage(m.chat, { text: `🛡️ _Session Valid. Injecting View Node..._`, edit: key });
        } else {
            throw new Error("Invalid or Expired PHPSESSID.");
        }

        // 2. TRIGGER VIEWS NODE
        // Zefoy 2026 uses a dynamic hex key for the URL parameter
        const res = await axios.post("https://zefoy.com/nodes/views.php", 
            new URLSearchParams({ "video_url": url }), 
            { headers }
        );

        await conn.sendMessage(m.chat, { 
            text: `✅ *ZEFOY INJECTION SUCCESSFUL*\n\n📈 *Status:* ${res.data.split('!')[0] || 'Views Sent'}\n🛡️ *Session:* Mirrored (Bypass Active)`, 
            edit: key 
        });

    } catch (err) {
        let msg = err.message;
        if (err.response?.status === 403) msg = "Cloudflare blocked the mirror. Your Server IP is too 'dirty'.";
        await conn.sendMessage(m.chat, { text: `❌ *ZEFOY ERROR:* ${msg}`, edit: key });
    }
};

handler.help = ['zefoy'];
handler.tags = ['social'];
handler.command = /^(zefoy|zviews)$/i;

export default handler;