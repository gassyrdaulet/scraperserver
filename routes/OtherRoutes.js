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
