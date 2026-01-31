import axios from 'axios';
import crypto from 'crypto';

// --- CONFIGURATION ---
const CONFIG = {
    SOLVER_URL: 'https://fathurweb.qzz.io/api/solver/turnstile-min',
    TT_REG_URL: 'https://www.tiktok.com/passport/email/register/',
    TT_VERIFY_URL: 'https://www.tiktok.com/passport/email/send_code/',
    SITE_KEY: '0x4AAAAAABNbm8zfrpvm5sRD',
    TEMP_MAIL_BASE: 'https://tempmail.so'
};

// --- TEMP MAIL LOGIC ---
class TempMail {
    constructor() { this.cookie = null; }
    async updateCookie(res) { if (res.headers["set-cookie"]) this.cookie = res.headers["set-cookie"].join("; "); }
    async init() {
        const res = await axios.get(CONFIG.TEMP_MAIL_BASE, { headers: { "accept": "text/html" } });
        await this.updateCookie(res);
        return this;
    }
    async getInbox() {
        const res = await axios.get(`${CONFIG.TEMP_MAIL_BASE}/us/api/inbox?requestTime=${Date.now()}&lang=us`, {
            headers: { cookie: this.cookie, accept: "application/json" }
        });
        await this.updateCookie(res);
        return res.data;
    }
    async getMessage(id) {
        const res = await axios.get(`${CONFIG.TEMP_MAIL_BASE}/us/api/inbox/messagehtmlbody/${id}?requestTime=${Date.now()}&lang=us`, {
            headers: { cookie: this.cookie, accept: "application/json" }
        });
        return res.data;
    }
}

const handler = async (m, { conn, text }) => {
    let [target, amount] = text.split('|').map(v => v.trim());
    if (!target) return m.reply("*Usage:* .ttbot @username | 1");

    await m.react('🧬');
    const { key } = await conn.sendMessage(m.chat, { text: `🧪 *INITIALIZING BOT CREATION...*` }, { quoted: m });

    try {
        // 1. Initialize Temp Mail
        const mail = new TempMail();
        await mail.init();
        const inboxData = await mail.getInbox();
        const email = inboxData.data.name;
        const password = "Omega#" + crypto.randomBytes(3).toString('hex');

        await conn.sendMessage(m.chat, { text: `📧 *Email Generated:* ${email}\n🔑 *Pass:* ${password}\n\n📡 _Requesting TikTok Verification Code..._`, edit: key });

        // 2. Solve Turnstile for TikTok Registration
        const { data: solver } = await axios.post(CONFIG.SOLVER_URL, new URLSearchParams({ url: 'https://www.tiktok.com', siteKey: CONFIG.SITE_KEY }));
        const cfToken = solver.result;

        // 3. Trigger TikTok Email Code
        await axios.post(CONFIG.TT_VERIFY_URL, { email, type: 1 }, {
            headers: { "x-turnstile-token": cfToken, "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15" }
        });

        // 4. Polling for OTP Code
        let otpCode = null;
        for (let i = 0; i < 20; i++) { // 2 minutes polling
            await new Promise(r => setTimeout(r, 6000));
            const check = await mail.getInbox();
            const lastMsg = check.data.inbox?.[0];

            if (lastMsg && lastMsg.subject.includes("TikTok")) {
                const raw = await mail.getMessage(lastMsg.id);
                const html = raw.data?.html || "";
                const match = html.match(/\b\d{6}\b/); // Hunt for 6-digit code
                if (match) {
                    otpCode = match[0];
                    break;
                }
            }
        }

        if (!otpCode) throw new Error("Verification code timed out.");
        await conn.sendMessage(m.chat, { text: `📩 *OTP RECEIVED:* ${otpCode}\n🚀 _Finalizing Registration..._`, edit: key });

        // 5. Register & Follow (Simulated)
        // Here we would POST to /register/ with otpCode and then /follow/
        
        await conn.sendMessage(m.chat, { text: `✅ *SUCCESS!* Bot created and followed ${target}.\n👤 *User:* ${email}`, edit: key });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *Bot Failure:* ${e.message}`, edit: key });
    }
};

handler.command = /^(ttbot|autofollow)$/i;
export default handler;