import { Router } from "express";
import pool from "../db.js";
import moment from "moment";

const router = new Router();

router.get("/checksub", async (req, res) => {
  try {
    const availableVersions = [
      "1.0.0",
      "1.0.1",
      "1.0.2",
      "1.0.3",
      "1.0.4",
      "1.0.5",
    ];
    const { storeid: storeId, version: clientVer } = req.headers;
    let versionAvailable = false;
    for (let version of availableVersions) {
      if (version === clientVer) {
        versionAvailable = true;
      }
    }
    if (!versionAvailable) {
      return res.status(400).json({
        message:
          "Ваша версия программы больше не поддерживается. Обновите программу.",
        version_error: true,
      });
    }
    const [subs] = await pool.query(
      `SELECT * FROM subs WHERE ? ORDER BY id DESC LIMIT 1;
    `,
      {
        store_id: storeId,
      }
    );
    const [sub] = subs;
    if (!sub) {
      return res
        .status(401)
        .json({ message: "У вас нет подписки", sub_error: true });
    }
    if (moment(sub.date).add(sub.days, "days") > moment()) {
      return res.status(200).json({ message: "ok" });
    }
    return res
      .status(401)
      .json({ message: "У вас нет активной подписки", sub_error: true });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

router.get("/checksubpayoff", async (req, res) => {
  try {
    const availableVersions = [
      "1.0.0",
      "1.0.1",
      "1.0.2",
      "1.0.3",
      "1.0.4",
      "1.0.5",
    ];
    const { storeid: storeId, clientver: clientVer } = req.headers;
    let versionAvailable = false;
    for (let version of availableVersions) {
      if (version === clientVer) {
        versionAvailable = true;
      }
    }
    if (!versionAvailable) {
      return res.status(400).json({
        message:
          "Ваша версия программы больше не поддерживается. Обновите программу.",
        version_error: true,
      });
    }
    const [subs] = await pool.query(
      `SELECT * FROM subspayoff WHERE ? ORDER BY id DESC LIMIT 1;
    `,
      {
        store_id: storeId,
      }
    );
    const [sub] = subs;
    if (!sub) {
      return res
        .status(401)
        .json({ message: "У вас нет подписки", sub_error: true });
    }
    if (moment(sub.date).add(sub.days, "days") > moment()) {
      return res.status(200).json({ message: "ok" });
    }
    return res
      .status(401)
      .json({ message: "У вас нет активной подписки", sub_error: true });
  } catch ({ message }) {
    console.log(message);
    res.status(500).json({ message });
  }
});

export default router;
