import mysql, { Pool, PoolConnection } from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "test",
};

let pool: Pool | undefined;

async function getConnection(): Promise<PoolConnection> {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool.getConnection();
}

export default getConnection;
