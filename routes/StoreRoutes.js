import { Router } from "express";
import pool from "../db.js";
import moment from "moment";
import { publishDeal } from "../bitrix.js";

const router = new Router();

const firstTimeDemoDays = 3;

router.get("/checksub", async (req, res) => {
  try {
    const { storeid: storeId, cityid: cityId } = req.headers;

    const clientVer = req.headers.clientver
      ? req.headers.clientver
      : req.headers.version;

    const unsupportedVersions = ["1.0.12", "1.0.14", "1.0.15"];

    if (unsupportedVersions.includes(clientVer)) {
      return res
        .status(400)
        .json({ message: "Ваша версия программы больше не поддерживается" });
    }

    const paymentMethods = {
      internet: [
        {
          available: false,
          text: "Оплата в интернете",
          url: `https://kaspi.kz/shop/p/-${storeId}`,
        },
      ],
      otherMethodsText: "Другие способы оплаты",
      other: [
        {
          available: false,
          text: "Kaspi.kz",
          url: `https://kaspi.kz/`,
          image: "https://i.ibb.co.com/NT7n84Y/KKS-F-9d710a31.png",
        },
        {
          available: true,
          text: "WhatsApp",
          url: `https://wa.me/7768290879?text=Здравствуйте!%20Хочу%20приобрести%20подписку.%20ID:%20${storeId}.`,
          image:
            "https://i.ibb.co.com/KLDPrQZ/2062095-application-chat-communication-logo-whatsapp-icon-svg.png",
        },
      ],
    };

    const checkSettings = async () => {
      const [settings_array] = await pool.query(
        `SELECT * FROM settings WHERE ?;
      `,
        {
          store_id: storeId,
        }
      );
      const defaultSettings = {
        store_id: storeId,
        damp: 1,
        city: cityId ? cityId : "710000000",
        interval: 5,
      };
      const [settings] = settings_array;
      if (!settings) {
        await pool.query(`INSERT INTO settings SET ?`, {
          ...defaultSettings,
          ignore: "[]",
        });
      }
      return settings ? settings : { ...defaultSettings, ignore: [] };
    };

    let versionAvailable = true;

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
      const { phone, sum, name } = await publishDeal(
        firstTimeDemoDays,
        storeId,
        9
      );
      const data = {
        store_id: storeId,
        days: firstTimeDemoDays,
        sum,
        cellphone: phone,
      };
      await pool.query(`INSERT INTO stores SET ?`, {
        store_id: storeId,
        name,
        phone,
      });
      await pool.query(`INSERT INTO subs SET ?`, data);
      await pool.query(
        `CREATE TABLE IF NOT EXISTS prices_${storeId} LIKE prices`
      );
      const settings = await checkSettings();
      return res
        .status(200)
        .json({ settings, sub: { ...data, date: new Date() }, paymentMethods });
    }
    if (moment(sub.date).add(sub.days, "days") > moment()) {
      const settings = await checkSettings();
      return res.status(200).json({ settings, sub, paymentMethods });
    }
    return res
      .status(401)
      .json({ message: "У вас нет активной подписки", sub_error: true });
  } catch ({ message }) {
    console.log(message);
    res.status(500).json({ message });
  }
});

router.post("/updatesettings", async (req, res) => {
  try {
    const { store_id, data } = req.body;
    const [settings_array] = await pool.query(
      `SELECT * FROM settings WHERE ?;
    `,
      {
        store_id,
      }
    );
    data.ignore = JSON.stringify(data.ignore);
    const city = data.city ? data.city : "710000000";
    delete data.city;
    const [settings] = settings_array;
    if (!settings) {
      await pool.query(`INSERT INTO settings SET ?`, {
        ...data,
        store_id,
        city,
      });
      return res.status(200).json({ message: "ok" });
    }
    await pool.query(
      `UPDATE settings SET ? WHERE store_id = "${store_id}"`,
      data
    );
    return res.status(200).json({ message: "ok" });
  } catch (e) {
    console.log(e);
    res.status(500).json(e.message);
  }
});

router.post("/gethistory", async (req, res) => {
  try {
    const { store_id } = req.body;
    await pool.query(
      `CREATE TABLE IF NOT EXISTS history_${store_id} like history`
    );
    const [history] = await pool.query(
      `SELECT * FROM history_${store_id} ORDER BY id DESC limit 20;
    `
    );
    return res.send(history.reverse());
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

router.post("/addtohistory", async (req, res) => {
  try {
    const { store_id, data, errorlog } = req.body;
    if (errorlog) {
      await pool.query(`DELETE FROM errorlog where store_id = "${store_id}"`);
      await pool.query(`INSERT INTO errorlog SET ?`, {
        store_id,
        errorlog: JSON.stringify(errorlog),
      });
    }
    await pool.query(
      `CREATE TABLE IF NOT EXISTS history_${store_id} like history`
    );
    await pool.query(`INSERT INTO history_${store_id} set ?`, data);
    return res.status(200).json({ message: "ok" });
  } catch ({ message }) {
    console.log(message);
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

router.get("/checksubpapers", async (req, res) => {
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
      `SELECT * FROM subspapers WHERE ? ORDER BY id DESC LIMIT 1;
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
