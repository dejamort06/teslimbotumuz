const express = require("express");
const { join } = require("path");
const { createReadStream } = require("fs");
const {
  createBot,
  createProvider,
  createFlow,
  addKeyword,
} = require("@bot-whatsapp/bot");

const BaileysProvider = require("@bot-whatsapp/provider/baileys");
const MockAdapter = require("@bot-whatsapp/database/mock");

const flowPrincipal = addKeyword(/.*/).addAnswer(
  async (ctx, { flowDynamic }) => {
    const message = ctx.body?.toLowerCase() || "";

    const isIBAN = message.startsWith("tr") && /\d{10,}/.test(message);
    const hasSwear = ["orospu cocukları", "şerefsizler"].some((w) => message.includes(w));
    const hasComplaint = ["şikayet", "savcılık", "karakol", "paramı istiyorum"].some((w) => message.includes(w));
    const isReturn = message.includes("iade");
    const isFirstReturn = message.includes("iade etmek istiyorum") || message.includes("iade edeceğim");
    const isSetup = message.includes("kurulum");
    const isShipping = message.includes("kargo");
    const isWhyShipping = message.includes("neden kargo");

    if (hasSwear) {
      return flowDynamic("⚠️ Lütfen daha uygun bir dil kullanın. Size yardımcı olmak için buradayız.");
    }

    if (isIBAN) {
      return flowDynamic("❌ WhatsApp üzerinden IBAN paylaşımı yapılmamaktadır.");
    }

    if (hasComplaint) {
      return flowDynamic([
        "📩 Şikayetinizi aşağıdaki form aracılığıyla bize iletebilirsiniz:",
        "🔗 https://docs.google.com/forms/d/e/1FAIpQLSe63XN8iqG7Otx8PNV33Hf8P4Y_obxWtXKFf50Dhi025a11uw/viewform?usp=header",
        "⚖️ Tüketici Hakem Heyeti'ne başvurmanız daha hızlı sonuç almanızı sağlayabilir.",
      ]);
    }

    if (isSetup) {
      return flowDynamic([
        "🔧 Kurulum artık uzaktan, online olarak yapılmaktadır.",
        "📱 Lütfen 5506987031 numaralı WhatsApp hattımıza ulaşın.",
        "☎️ Kendiniz kuramazsanız, aramanız durumunda da yardımcı olunacaktır.",
      ]);
    }

    if (isShipping) {
      return flowDynamic([
        "📦 Kargo süresi maksimum 48 saattir.",
        "🛠️ Sistemsel gecikmeler olabilir, ama cihazınız kısa sürede elinize ulaşacaktır.",
        "📞 Gecikme durumunda 5506987031 numarasından yardım alabilirsiniz.",
      ]);
    }

    if (isWhyShipping) {
      return flowDynamic("📦 Cihazlar özel gönderilen akıllı cihazlar olduğu için kargo ile gönderilmektedir.");
    }

    if (isFirstReturn) {
      return flowDynamic(
        "🔁 İade işlemleri için size SMS ile gelen numaralardan ulaşmanız gerekmektedir."
      );
    }

    if (isReturn) {
      return flowDynamic([
        "🔁 İade talebiniz için aşağıdaki formu doldurmanız gerekmektedir:",
        "📄 https://docs.google.com/forms/d/e/1FAIpQLSe63XN8iqG7Otx8PNV33Hf8P4Y_obxWtXKFf50Dhi025a11uw/viewform?usp=header",
      ]);
    }

    return flowDynamic(
      "👋 Merhaba, cihazınızla ilgili işlemlerde size yardımcı olmak için buradayız. Lütfen mesajınızı detaylı şekilde iletin."
    );
  }
);

const app = express();
const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = createFlow([flowPrincipal]);
  const adapterProvider = createProvider(BaileysProvider);

  createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });

  app.post("/send-message-bot", async (req, res) => {
    await adapterProvider.sendText("52XXXXXXXXX@c.us", "Mensaje desde API");
    res.send({ data: "enviado!" });
  });

  app.post("/send-message-provider", async (req, res) => {
    const id = "52XXXXXXXXX@c.us";
    const templateButtons = [
      {
        index: 1,
        urlButton: {
          displayText: ":star: Star Baileys on GitHub!",
          url: "https://github.com/adiwajshing/Baileys",
        },
      },
      {
        index: 2,
        callButton: {
          displayText: "Call me!",
          phoneNumber: "+1 (234) 5678-901",
        },
      },
      {
        index: 3,
        quickReplyButton: {
          displayText: "This is a reply, just like normal buttons!",
          id: "id-like-buttons-message",
        },
      },
    ];

    const templateMessage = {
      text: "Hi it's a template message",
      footer: "Hello World",
      templateButtons: templateButtons,
    };

    const abc = await adapterProvider.getInstance();
    await abc.sendMessage(id, templateMessage);

    res.send({ data: "enviado!" });
  });

  app.get("/get-qr", async (_, res) => {
    const YOUR_PATH_QR = join(process.cwd(), `bot.qr.png`);
    const fileStream = createReadStream(YOUR_PATH_QR);

    res.writeHead(200, { "Content-Type": "image/png" });
    fileStream.pipe(res);
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
};

main();
