/**
 * 🔍 Bilibili Search Plugin
 * Description: Search Bilibili videos and return results
 * Creator: OMEGATECH
 */

import axios from "axios";
import * as cheerio from "cheerio";

let handler = async (m, { conn, args, usedPrefix, command }) => {
  try {
    if (!args || args.length === 0)
      throw new Error(`Usage: ${usedPrefix}${command} <query>\nExample: ${usedPrefix}${command} anime`);

    const query = args.join(" ").trim();
    await conn.sendMessage(m.chat, { text: `🔎 Searching Bilibili for: ${query}...` }, { quoted: m });

    const url = `https://www.bilibili.tv/en/search-result?q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const results = [];

    $("li.section__list__item").each((i, el) => {
      const title = $(el).find(".highlights i").text().trim();
      let videoUrl = $(el).find(".bstar-video-card__cover-link").attr("href");
      if (videoUrl && !videoUrl.startsWith("http")) videoUrl = "https:" + videoUrl;
      const thumbnail = $(el).find(".bstar-image__img").attr("src");
      const duration = $(el).find(".bstar-video-card__cover-mask-text--bold").text().trim();
      const uploader = $(el).find(".bstar-video-card__nickname span").text().trim();
      const views = $(el).find(".bstar-video-card__desc").text().trim().replace("·", "").trim();

      if (title && videoUrl) results.push({ title, videoUrl, thumbnail, duration, uploader, views });
    });

    if (!results.length) throw new Error("❌ No results found.");

    // Format results into a readable message
    const text = results.slice(0, 5).map((r, i) => (
      `🎬 *${r.title}*\n👤 Uploader: ${r.uploader}\n⏱️ Duration: ${r.duration}\n👁️ Views: ${r.views}\n🔗 ${r.videoUrl}\n`
    )).join("\n");

    await conn.sendMessage(m.chat, { text: `🔎 Results for: *${query}*\n\n${text}` }, { quoted: m });

  } catch (e) {
    console.error("Bilibili Search Error:", e);
    m.reply(`💀 *Bilibili Search Failed.*\n⚙️ Error: ${e.message}`);
  }
};

handler.help = ['bilibili <query>'];
handler.tags = ['search'];
handler.command = /^bilibili|bili$/i;
handler.premium = false;
handler.limit = true;
handler.register = true;

export default handler;