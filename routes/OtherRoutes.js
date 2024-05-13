import { Router } from "express";
import fs from "fs/promises";

const router = new Router();

router.get("/getaboutinfo", async (_, res) => {
  try {
    return res.status(200).json({
      message:
        "Эта программа предназначена для автоматического снижения цен. Больше информации Вы можете получить по номеру +77068290879",
    });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

router.post("/helpandcontacts", async (_, res) => {
  try {
    const cities = JSON.parse((await fs.readFile("./cities.json")).toString());
    return res.status(200).json({
      contactsText: "Вы можете связаться с нами по этим контактам:",
      cities,
      help: [
        {
          url: "https://youtu.be/4zYW2BT5Q7Y",
          text: "Ссылка на видео-инструкцию",
        },
      ],
      contacts: [
        {
          name: "Instagram",
          text: "Ссылка на профиль",
          url: "https://www.instagram.com/legion_software",
        },
        {
          name: "WhatsApp",
          text: "+7 (776) 829 08 79",
          url: "https://wa.me/77768290879",
        },
        {
          name: "Telegram",
          text: "@mister_protocol",
          url: "https://t.me/mister_protocol",
        },
      ],
    });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

router.get("/getpayoffconfig", async (_, res) => {
  try {
    const text = await fs.readFile("./payoffconfig.json");
    return res.status(200).json({ text });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

router.get("/getpapersconfig", async (_, res) => {
  try {
    const text = await fs.readFile("./papersconfig.json");
    return res.status(200).json({ text });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

export default router;
