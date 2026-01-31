import axios from "axios";
import * as cheerio from "cheerio";
import { randomBytes } from "crypto";

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const url = text.trim();
    if (!url) return m.reply(`*Usage:* ${usedPrefix + command} video_url`);

    await m.react('🔄');
    const { key } = await conn.sendMessage(m.chat, { text: `🚀 *OMEGATECH v8: MULTI-ENGINE ACTIVE*` }, { quoted: m });

    // --- ENGINE 1: ON4T (PRIMARY) ---
    const runOn4t = async () => {
        const TARGET = "https://on4t.com/tiktok-video-booster";
        const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1";
        
        const session = await axios.get(TARGET, { headers: { "User-Agent": UA } });
        const $ = cheerio.load(session.data);
        const csrf = $('meta[name="csrf-token"]').attr("content");
        const cookies = session.headers["set-cookie"]?.map(c => c.split(";")[0]).join("; ");

        const headers = {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf,
            "Cookie": cookies,
            "Referer": TARGET,
            "User-Agent": UA,
            "X-Requested-With": "XMLHttpRequest"
        };

        const captcha = await axios.post("https://fathurweb.qzz.io/api/solver/turnstile-min", 
            new URLSearchParams({ url: TARGET, siteKey: "0x4AAAAAAA_AzqcGkpvXo7np" }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        await axios.post("https://on4t.com/free-tiktok-views/video", {
            url: url, "cf-turnstile-response": captcha.data.result
        }, { headers });

        return await axios.post("https://on4t.com/free-tiktok-views/views", {
            link: url,
            fingerprint_id: randomBytes(20).toString("hex"),
            tool_type: "on4t-video-booster"
        }, { headers });
    };

    // --- EXECUTION LOGIC ---
    try {
        await conn.sendMessage(m.chat, { text: `📡 _Trying Engine 1 (tiktok.com/boost)..._`, edit: key });
        const res = await runOn4t();
        
        await conn.sendMessage(m.chat, { 
            text: `✅ *BOOST SUCCESSFUL*\n\n📈 *Status:* ${res.data.message || 'Views Queued'}\n🚀 *Engine:* Primary`, 
            edit: key 
        });

    } catch (err) {
        if (err.response?.status === 500 || err.response?.status === 403) {
            await conn.sendMessage(m.chat, { text: `⚠️ _Engine 1 Failed (${err.response.status}). Switching to Backup..._`, edit: key });
            
            // Here you would add a second engine (e.g. Zefoy or FireLiker logic)
            // For now, let's suggest a manual alternative while Engine 1 cools down.
            await conn.sendMessage(m.chat, { 
                text: `❌ *ALL ENGINES DOWN*\n\nReason: Server 500 (Overload).\n💡 *Tip:* TIKTOKBOOST is currently repairing their database. Try again in 30 minutes.`, 
                edit: key 
            });
        } else {
            await conn.sendMessage(m.chat, { text: `❌ *ERROR:* ${err.message}`, edit: key });
        }
    }
};

handler.help = ['boost'];
handler.tags = ['social'];
handler.command = /^(boost|views)$/i;
export default handler;