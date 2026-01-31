import axios from "axios";

const AVAILABLE_LANGS = [
  'en','es','zh','zh-TW','fr','de','ja','ru','pt','ar',
  'ko','it','nl','tr','pl','vi','th','hi','id'
];

const AVAILABLE_MODELS = [
  'general','midjourney','dalle','stable_diffusion','flux'
];

const handler = async (m, { conn, text, command }) => {
  const q = m.quoted || m;
  const mime = q.mimetype || q.msg?.mimetype || "";

  if (!/image/.test(mime))
    return m.reply("❌ Reply to an image.");

  let [language = "en", model = "general"] = text.split("|").map(v => v.trim());

  if (!AVAILABLE_LANGS.includes(language))
    return m.reply(
      `❌ Invalid language\n\nAvailable:\n${AVAILABLE_LANGS.join(", ")}`
    );

  if (!AVAILABLE_MODELS.includes(model))
    return m.reply(
      `❌ Invalid model\n\nAvailable:\n${AVAILABLE_MODELS.join(", ")}`
    );

  await m.react("🧠");

  try {
    const buffer = await q.download();

    if (!Buffer.isBuffer(buffer))
      return m.reply("❌ Failed to read image buffer.");

    const base64 = buffer.toString("base64");

    const { data } = await axios.post(
      "https://api.imagepromptguru.net/image-to-prompt",
      {
        image: `data:image/jpeg;base64,${base64}`,
        language,
        model
      },
      {
        headers: {
          origin: "https://imagepromptguru.net",
          referer: "https://imagepromptguru.net/",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/130 Mobile"
        },
        timeout: 60000
      }
    );

    if (!data?.prompt)
      return m.reply("❌ No prompt returned.");

    await conn.sendMessage(
      m.chat,
      {
        text:
          `🖼️ *IMAGE → PROMPT*\n\n` +
          `🌐 Language: ${language}\n` +
          `🎨 Model: ${model}\n\n` +
          `📜 *Prompt:*\n${data.prompt}`
      },
      { quoted: m }
    );

    await m.react("✅");

  } catch (e) {
    console.error("IMG2PROMPT ERROR:", e);
    m.reply("💥 Failed to extract prompt from image.");
  }
};

handler.help = ["img2prompt <lang>|<model>"];
handler.tags = ["ai"];
handler.command = /^(img2prompt|imageprompt|imgprompt|prompt)$/i;

export default handler;