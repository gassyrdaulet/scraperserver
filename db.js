import mysql from "mysql2/promise";
import config from "./config.json" assert { type: "json" };

const { PRODUCTION, dbConfig, dbHost } = config;

const pool = mysql.createPool({
  host: PRODUCTION ? "127.0.0.1" : dbHost,
  ...dbConfig,
});

export default pool;
