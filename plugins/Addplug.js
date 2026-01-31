import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

let handler = async (m, { text, conn, usedPrefix, command }) => {
    let filename, code;
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    try {
        // --- METHOD 1: REPLY TO A .JS FILE ---
        if (m.quoted && (mime === 'application/javascript' || q.filename?.endsWith('.js'))) {
            await m.react('📥');
            code = await q.download(); // Downloads the file buffer
            filename = q.filename || text.split('|')[0].trim();
            
            if (!filename.endsWith('.js')) filename += '.js';
        } 
        // --- METHOD 2: PASTE CODE (TEXT FORMAT) ---
        else {
            if (!text.includes("|")) 
                throw `⚠️ *Format:* \n1. ${usedPrefix + command} name.js | <code>\n2. Reply to a .js file with ${usedPrefix + command}`;

            let [name, ...rest] = text.split("|");
            filename = name.trim().replace(/[^a-zA-Z0-9_.-]/g, "");
            if (!filename.endsWith(".js")) filename += ".js";

            code = rest.join("|").trim();
            if (!code) throw "⚠️ Missing plugin code.";
            await m.react('💾');
        }

        // Define Path (Assuming standard 'plugins' folder in root)
        const pluginDir = path.join(process.cwd(), 'plugins');
        const filePath = path.join(pluginDir, filename);

        // Ensure directory exists and save file
        if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir, { recursive: true });
        fs.writeFileSync(filePath, code, "utf8");

        // --- HOT RELOAD LOGIC (NO RESTART NEEDED) ---
        // 1. Generate unique URL to bypass ESM cache
        const fileUrl = pathToFileURL(filePath).href + `?t=${Date.now()}`;
        
        // 2. Import the new module
        const newPlugin = await import(fileUrl);
        
        // 3. Inject directly into the bot's global plugin map
        // This makes the command work IMMEDIATELY
        global.plugins[filename] = newPlugin.default || newPlugin;

        await conn.reply(m.chat, `✅ *Installation Successful*\n\n• *File:* ${filename}\n• *Status:* Live & Reloaded\n\n_You can now use the new command without restarting the panel._`, m);
        await m.react('✅');

    } catch (e) {
        console.error(e);
        await conn.reply(m.chat, `💀 *Installation Failed:*\n${e.message || e}`, m);
        await m.react('❌');
    }
};

handler.help = ["addplugin"];
handler.tags = ["owner"];
handler.command = /^(addplugin|install)$/i;
handler.owner = true;

export default handler;