require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
  });

  await connection.query(
    'CREATE DATABASE IF NOT EXISTS `GlobalTour` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  );
  const [rows] = await connection.query("SHOW DATABASES LIKE 'GlobalTour'");
  console.log(JSON.stringify(rows));
  await connection.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
