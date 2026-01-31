const handler = async (m, { conn, text, command }) => {
    // COMMAND: .listvoice
    if (command === 'listvoice') {
        await m.react('📜');
        const list = await NiceVoice.getVoices();
        return m.reply(`🎭 *NICEVOICE CHARACTERS*\n\n${list.map(v => `• ${v}`).join('\n')}\n\n*Usage:* .tts elon-musk | your text`);
    }

    // COMMAND: .tts
    let [voice, input] = text.split('|').map(v => v.trim());
    if (!voice || !input) return m.reply("❌ Usage: .tts mr-beast | Hello world");

    await m.react('🗣️');
    const { key } = await conn.sendMessage(m.chat, { text: `🧬 _Generating ${voice} audio..._` }, { quoted: m });

    try {
        const audioBuffer = await NiceVoice.generate(voice, input);
        
        await conn.sendMessage(m.chat, { 
            audio: Buffer.from(audioBuffer), 
            mimetype: 'audio/mpeg', 
            ptt: true 
        }, { quoted: m });

        await conn.sendMessage(m.chat, { text: `✅ _Speech Synthesized!_`, edit: key });

    } catch (e) {
        // If the API is guarded by a new Token, we fallback to the high-quality demo files
        const demoUrl = `https://nicevoice.org/voices/demo/${voice.toLowerCase().replace(/\s+/g, '-')}.mp3`;
        await conn.sendMessage(m.chat, { audio: { url: demoUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m });
        await conn.sendMessage(m.chat, { text: `⚠️ _Live API rejected. Sent cached demo instead._`, edit: key });
    }
};

handler.help = ['tts', 'listvoice'];
handler.command = /^(tts|listvoice|nicevoice)$/i;
export default handler;