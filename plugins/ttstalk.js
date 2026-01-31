import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';

// --- HELPER FUNCTION: STALK LOGIC ---
async function stalkTikTok(username) {
    try {
        // Phase 1: Solve Turnstile Captcha
        const { data: solver } = await axios.post(
            'https://fathurweb.qzz.io/api/solver/turnstile-min',
            new URLSearchParams({
                url: 'https://www.anonymous-viewer.com',
                siteKey: '0x4AAAAAABNbm8zfrpvm5sRD'
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (!solver.status || !solver.result) {
            throw new Error('Cloudflare Handshake Failed.');
        }
        const cfToken = solver.result;

        // Phase 2: Fetch TikTok Data
        const { data } = await axios.get(
            `https://www.anonymous-viewer.com/api/tiktok/display?username=${username}`,
            {
                headers: {
                    "accept": "*/*",
                    "user-agent": "Mozilla/5.0 (Linux; Android 10)",
                    "x-turnstile-token": cfToken,
                    "referer": `https://www.anonymous-viewer.com/tiktok/${username}`
                }
            }
        );
        return data;
    } catch (error) {
        throw new Error(error.message);
    }
}

// --- MAIN HANDLER ---
let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*⚠️ Input Required:* Provide a TikTok username.\n*Example:* ${usedPrefix + command} khaby.lame`);

    await m.react('🔍');
    await m.reply('✨ *Lady-Trish Crawler:* Bypassing Cloudflare and extracting user metadata...');

    try {
        const res = await stalkTikTok(text.replace('@', ''));
        
        if (!res.profile || !res.profile.userInfo) throw 'Subject not found in TikTok database.';

        const info = res.profile.userInfo.user;
        const stats = res.profile.userInfo.stats;
        const latestPost = res.posts.originalItems[0];

        // --- CANVAS DRAWING (Intelligence Dashboard) ---
        const width = 1000;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // 1. Background: Deep Onyx
        ctx.fillStyle = '#020205';
        ctx.fillRect(0, 0, width, height);

        // Cyber Grid Accents
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 50) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        }

        // 2. Header Bar
        ctx.fillStyle = '#00d2ff';
        ctx.fillRect(0, 0, width, 80);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TIKTOK INTELLIGENCE DOSSIER', width / 2, 55);

        // 3. User Profile Image (Circle)
        let pfp;
        try {
            pfp = await loadImage(info.avatarLarger || info.avatarThumb);
        } catch {
            pfp = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg');
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(180, 250, 110, 0, Math.PI * 2);
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(pfp, 70, 140, 220, 220);
        ctx.restore();

        // 4. Stats Section (Glassmorphism)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText(info.nickname || info.uniqueId, 330, 170);
        
        ctx.fillStyle = '#00d2ff';
        ctx.font = '22px monospace';
        ctx.fillText(`@${info.uniqueId}`, 330, 205);

        // Draw Stat Boxes
        const drawStat = (label, value, x, y) => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.roundRect(x, y, 200, 80, 10);
            ctx.fill();
            ctx.fillStyle = '#00d2ff';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(nFormatter(value), x + 20, y + 40);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '14px sans-serif';
            ctx.fillText(label.toUpperCase(), x + 20, y + 65);
        };

        drawStat('Followers', stats.followerCount, 330, 240);
        drawStat('Following', stats.followingCount, 550, 240);
        drawStat('Hearts', stats.heartCount, 770, 240);
        drawStat('Videos', stats.videoCount, 330, 340);

        // 5. Bio / Description
        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 18px sans-serif';
        const bio = info.signature || "No signature provided.";
        ctx.fillText(`BIO: ${bio.slice(0, 60)}...`, 330, 460);

        // 6. Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('LADY-TRISH INTELLIGENCE • POWERED BY OMEGATECH', width / 2, 560);

        // --- FINALIZATION ---
        const buffer = canvas.toBuffer('image/png');
        
        let caption = `*👤 TIKTOK PROFILE STALKED*
        
📌 *Name:* ${info.nickname}
🆔 *Username:* @${info.uniqueId}
👥 *Followers:* ${stats.followerCount.toLocaleString()}
❤️ *Total Likes:* ${stats.heartCount.toLocaleString()}
🎬 *Posts:* ${stats.videoCount.toLocaleString()}

📖 *Signature:* 
_${info.signature || 'No Bio'}_

🔗 *Profile Link:* https://www.tiktok.com/@${info.uniqueId}`;

        if (latestPost) {
            caption += `\n\n📺 *Latest Video Info:*
📝 *Caption:* ${latestPost.desc || 'No description'}
📊 *Views:* ${latestPost.stats.playCount.toLocaleString()}
💬 *Comments:* ${latestPost.stats.commentCount.toLocaleString()}`;
        }

        await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });
        await m.react('✅');

    } catch (e) {
        console.error(e);
        m.reply(`❌ *Stalk Failed:* ${e.message || e}\n\n_Note: The solver or the viewer API might be down._`);
    }
};

// Formatting large numbers (1.2M, etc.)
function nFormatter(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num;
}

handler.help = ['ttstalk <username>'];
handler.tags = ['tools', 'search'];
handler.command = /^(ttstalk|tiktokstalk)$/i;

export default handler;