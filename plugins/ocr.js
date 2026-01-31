/**
 * 📸 Case: ocr — Extract text from image
 * 🧠 Author: OMEGATECH (structured like your other plugins)
 *
 * Usage:
 *   .ocr (reply to image)
 *
 * Notes:
 *  - Automatically reads text from any image (jpg/png)
 *  - Uses AI-based OCR API
 *  - Replies with extracted text in plain format
 */

import fetch from "node-fetch";

let handler = async (m, { conn, usedPrefix, command }) => {
  try {
    const q = m.quoted ? m.quoted : m;
    const mime =
      (q.msg || q).mimetype ||
      q.mimetype ||
      q.message?.imageMessage?.mimetype;

    if (!mime || !/image/.test(mime))
      return m.reply(
        `⚠️ Send or reply to an image with caption *${usedPrefix + command}* to extract text.`
      );

    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

    const buffer = await q.download();
    const mimeType = /png/.test(mime) ? "image/png" : "image/jpeg";
    const imageBase64 = buffer.toString("base64");

    const url = "https://staging-ai-image-ocr-266i.frontend.encr.app/api/ocr/process";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }

    const json = await res.json();
    const text = json.extractedText?.trim() || "⚠️ No text detected in the image.";

    await m.reply(`📄 *Extracted Text:*\n\n${text}`);
    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
  } catch (err) {
    console.error("💀 OCR Plugin Error:", err);
    await m.reply(`💀 *OCR Failed.*\n⚙️ Error: ${err.message}\n🌐 API by *OMEGATECH*`);
    await conn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
  }
};

handler.help = ["ocr"];
handler.tags = ["tools", "utility"];
handler.command = /^ocr$/i;
handler.owner = false;
handler.premium = false;
handler.limit = true;

export default handler;