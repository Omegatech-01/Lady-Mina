import axios from 'axios';

const handler = async (m, { conn, text }) => {
    const targetUrl = text.trim() || "https://denki-toolweb.lovable.app/";
    await m.react('🕵️');
    
    const { key } = await conn.sendMessage(m.chat, { text: `🛰️ _Deep-scanning ${targetUrl} for API secrets and headers..._` }, { quoted: m });

    try {
        // 1. Fetch Main Page & Identify JS Assets
        const { data: html } = await axios.get(targetUrl);
        const scriptTags = html.match(/src="(\/assets\/index-[A-Za-z0-9_-]+\.js)"/g) || [];
        
        let apiEndpoints = new Set();
        let hiddenKeys = new Set();
        let headersFound = {
            "apikey": null,
            "Authorization": null,
            "X-Client-Info": "supabase-js-v2"
        };

        // 2. Scan every Javascript Bundle
        for (let tag of scriptTags) {
            const jsUrl = targetUrl + tag.split('"')[1];
            const { data: code } = await axios.get(jsUrl);

            // Extract Supabase/API URLs
            const urlMatches = code.match(/https:\/\/[a-z0-9]{20}\.supabase\.co/g);
            if (urlMatches) urlMatches.forEach(u => apiEndpoints.add(u));

            // Extract JWT/API Keys (Base64 Pattern)
            const keyMatches = code.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9._-]{50,}/g);
            if (keyMatches) keyMatches.forEach(k => hiddenKeys.add(k));
            
            // Extract Custom Headers
            if (code.includes('apikey')) headersFound.apikey = "Detected in code";
            if (code.includes('Bearer')) headersFound.Authorization = "Bearer [Dynamic]";
        }

        // 3. Format the Intelligence Report
        let report = `📂 *RECON INTELLIGENCE REPORT* ✅\n\n`;
        report += `🌐 *Target:* ${targetUrl}\n`;
        report += `──────────────────\n\n`;

        report += `🔌 *API ENDPOINTS:*\n${Array.from(apiEndpoints).map(u => `> \`${u}\``).join('\n') || "_None detected_"}\n\n`;

        report += `🔑 *IDENTIFIED KEYS (${hiddenKeys.size}):*\n`;
        Array.from(hiddenKeys).forEach((k, i) => {
            report += `*Key ${i+1}:* \`${k.slice(0, 15)}...${k.slice(-10)}\`\n`;
        });

        report += `\n✉️ *HEADER KIT:*\n`;
        report += `\`\`\`json\n${JSON.stringify(headersFound, null, 2)}\n\`\`\`\n\n`;

        report += `🧬 *SCHEMA MAP:* \nRun \`.blueprint\` to map the tables found at these endpoints.`;

        await conn.sendMessage(m.chat, { text: report, edit: key });

    } catch (e) {
        await conn.sendMessage(m.chat, { text: `❌ *Scrape Failed:* ${e.message}`, edit: key });
    }
};

handler.help = ['recon'];
handler.tags = ['owner'];
handler.command = /^(recon|scraper|fullkit)$/i;

export default handler;