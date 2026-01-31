import axios from 'axios';
import crypto from 'crypto';

const CONFIG = {
    API_URL: "https://vnuturzxvxkjbkawgnpf.supabase.co",
    API_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudXR1cnp4dnhramJrYXdnbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTcxMzQsImV4cCI6MjA4NDU5MzEzNH0.v1pLqnN0VuYAeCSqKU3KEbGxam-hIc0md31WPhEiImQ",
    REFERER: "https://denki-toolweb.lovable.app/"
};

const RANDOM_COMMENTS = [
    "This is exactly what I needed!", "Amazing tool, thanks for sharing.", 
    "Working perfectly for me.", "Clean UI, I love it.", 
    "Great job on this one!", "Highly recommended!", 
    "Keep up the good work!", "Best tool in this category."
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const handler = async (m, { conn, text, usedPrefix, command }) => {
    let [targetName, count] = text.split('|').map(v => v.trim());
    let totalGoal = parseInt(count) || 5;

    if (!targetName) return m.reply(`*Usage:* ${usedPrefix + command} username | amount`);

    await m.react('🎯');
    const { key } = await conn.sendMessage(m.chat, { text: `📡 _Locating target and mapping tools..._` }, { quoted: m });

    try {
        // 1. Resolve Target User and their Tools
        const userResp = await axios.get(`${CONFIG.API_URL}/rest/v1/profiles?username=ilike.${targetName}`, { headers: { "apikey": CONFIG.API_KEY } });
        if (!userResp.data.length) throw new Error("Target user not found.");
        
        const target = userResp.data[0];
        const toolResp = await axios.get(`${CONFIG.API_URL}/rest/v1/tools?user_id=eq.${target.user_id}`, { headers: { "apikey": CONFIG.API_KEY } });
        const tools = toolResp.data;

        await conn.sendMessage(m.chat, { 
            text: `🎯 *TARGET LOCKED: ${target.username}*\n📦 Tools Found: ${tools.length}\n👥 Swarm Size: ${totalGoal}\n_Initializing identity theft..._`, 
            edit: key 
        });

        for (let i = 0; i < totalGoal; i++) {
            try {
                // Identity Generation
                const id = crypto.randomBytes(3).toString('hex');
                const botEmail = `user_${id}@omega.tech`;
                const botPass = `Omega#${id}2026`;
                
                // Account Creation
                const signup = await axios.post(`${CONFIG.API_URL}/auth/v1/signup`, {
                    email: botEmail, password: botPass, data: { username: `Bot_${id}`, display_name: `User ${id}` }
                }, { headers: { "apikey": CONFIG.API_KEY, "Content-Type": "application/json" } });

                const token = signup.data.access_token;
                const botId = signup.data.user?.id;
                if (!token) continue;

                // Action 1: Follow the Target
                await axios.post(`${CONFIG.API_URL}/rest/v1/follows`, 
                    { follower_id: botId, following_id: target.user_id }, 
                    { headers: { "apikey": CONFIG.API_KEY, "Authorization": `Bearer ${token}` } }
                ).catch(() => {});

                // Action 2 & 3: Like and Comment on EVERY Tool found
                for (let tool of tools) {
                    const randomComment = RANDOM_COMMENTS[Math.floor(Math.random() * RANDOM_COMMENTS.length)];
                    
                    // Like
                    await axios.post(`${CONFIG.API_URL}/rest/v1/likes`, 
                        { user_id: botId, tool_id: tool.id }, 
                        { headers: { "apikey": CONFIG.API_KEY, "Authorization": `Bearer ${token}` } }
                    ).catch(() => {});

                    // Comment
                    await axios.post(`${CONFIG.API_URL}/rest/v1/comments`, 
                        { user_id: botId, tool_id: tool.id, content: randomComment }, 
                        { headers: { "apikey": CONFIG.API_KEY, "Authorization": `Bearer ${token}` } }
                    ).catch(() => {});
                }

                if ((i + 1) % 2 === 0) {
                    await conn.sendMessage(m.chat, { text: `🚀 *SWARMING...*\nBot ${i+1}/${totalGoal} active.\n_Interacting with all ${tools.length} tools._`, edit: key });
                    await sleep(7000); // Respect the firewall
                }

            } catch (err) { console.log(err.message); await sleep(5000); }
        }

        await conn.sendMessage(m.chat, { text: `🏆 *MISSION ACCOMPLISHED*\nTarget: ${target.username}\nInteractions: ${(totalGoal * tools.length) + totalGoal}\n_Target is now verified trending._`, edit: key });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *Overlord Error:* ${e.message}`, edit: key });
    }
};

handler.help = ['overlord'];
handler.tags = ['owner'];
handler.command = /^(overlord|targetswarm)$/i;

export default handler;