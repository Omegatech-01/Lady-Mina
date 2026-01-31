import axios from "axios";

const API_URL = "https://api.wrmgpt.com/v1/chat/completions";
const AUTHORIZATION = "sk_live_0003c489-6095-453d-b3f5-dd87237aa69eb001";

let handler = async (m, { text }) => {
  if (!text) throw "👻 Ingresa un mensaje para enviar a WormGPT.";

  try {
    const response = await axios.post(
      API_URL,
      {
        model: "wormgpt-v7",
        messages: [
          {
            role: "user",
            content: text,
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${AUTHORIZATION}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content || "No hubo respuesta del modelo 🥲";
    await m.reply(reply);
  } catch (error) {
    console.error("[😔] Error al conectar con la API:", error.response?.data || error.message);
    await m.reply("❌ Error al contactar con WormGPT.");
  }
};

handler.help = ["wormgpt+ <texto>"];
handler.tags = ["ia"];
handler.command = ["wormgpt+", "wgpt"];

export default handler;