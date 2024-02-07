import { Router } from "express";
import pool from "../db.js";
import moment from "moment";

const router = new Router();

router.get("/getaboutinfo", async (req, res) => {
  try {
    return res.status(200).json({
      message:
        "Эта программа предназначена для автоматического снижения цен. Больше информации Вы можете получить по номеру +77088135765",
    });
  } catch ({ message }) {
    res.status(500).json({ message });
  }
});

export default router;
