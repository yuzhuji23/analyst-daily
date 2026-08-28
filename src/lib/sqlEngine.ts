import type { Database, QueryExecResult } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

let cached: Database | null = null;
let loading: Promise<Database> | null = null;

function rng(seed: number) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dateAt(start: Date, dayOffset: number, rand: () => number) {
  const d = new Date(start.getTime() + dayOffset * 86400000);
  const h = Math.floor(rand() * 14) + 8;
  const m = Math.floor(rand() * 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(h)}:${pad(m)}:00`;
}

function isoDay(start: Date, dayOffset: number) {
  const d = new Date(start.getTime() + dayOffset * 86400000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const SCHEMA_TEXT = `users(user_id, register_dt, city, channel, gender)
merchants(merchant_id, name, city, category)
sku(sku_id, merchant_id, name, price, category)
campaigns(campaign_id, name, start_dt, end_dt, type, cost)
orders(order_id, user_id, merchant_id, order_dt, status, pay_amount, channel, campaign_id, city)
order_items(order_id, sku_id, qty, price)
events(event_id, user_id, event_dt, event_name, merchant_id)`;

function seed(db: Database) {
  db.run(`
    CREATE TABLE users (
      user_id INTEGER PRIMARY KEY,
      register_dt TEXT,
      city TEXT,
      channel TEXT,
      gender TEXT
    );
    CREATE TABLE merchants (
      merchant_id INTEGER PRIMARY KEY,
      name TEXT,
      city TEXT,
      category TEXT
    );
    CREATE TABLE sku (
      sku_id INTEGER PRIMARY KEY,
      merchant_id INTEGER,
      name TEXT,
      price REAL,
      category TEXT
    );
    CREATE TABLE campaigns (
      campaign_id INTEGER PRIMARY KEY,
      name TEXT,
      start_dt TEXT,
      end_dt TEXT,
      type TEXT,
      cost REAL
    );
    CREATE TABLE orders (
      order_id INTEGER PRIMARY KEY,
      user_id INTEGER,
      merchant_id INTEGER,
      order_dt TEXT,
      status TEXT,
      pay_amount REAL,
      channel TEXT,
      campaign_id INTEGER,
      city TEXT
    );
    CREATE TABLE order_items (
      order_id INTEGER,
      sku_id INTEGER,
      qty INTEGER,
      price REAL
    );
    CREATE TABLE events (
      event_id INTEGER PRIMARY KEY,
      user_id INTEGER,
      event_dt TEXT,
      event_name TEXT,
      merchant_id INTEGER
    );
  `);

  const rand = rng(20260828);
  const cities = ["上海", "北京", "杭州", "广州", "成都", "深圳"];
  const channels = ["自然", "字节广告", "朋友圈", "达人", "SEO"];
  const genders = ["F", "M"];
  const cats = ["外卖", "到店", "电商", "酒店"];
  const start = new Date("2026-05-01T00:00:00");
  const span = 119;

  const userStmt = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)");
  for (let i = 1; i <= 90; i++) {
    const day = Math.floor(rand() * span);
    userStmt.run([i, isoDay(start, day), pick(rand, cities), pick(rand, channels), pick(rand, genders)]);
  }
  userStmt.free();

  const names = ["江南", "北城", "星选", "快达", "邻里", "山海", "青禾", "夜色", "里巷", "晴空"];
  const merStmt = db.prepare("INSERT INTO merchants VALUES (?, ?, ?, ?)");
  for (let i = 1; i <= 40; i++) {
    merStmt.run([i, `${pick(rand, names)}${pick(rand, cats)}${i}`, pick(rand, cities), pick(rand, cats)]);
  }
  merStmt.free();

  const skuStmt = db.prepare("INSERT INTO sku VALUES (?, ?, ?, ?, ?)");
  let skuId = 1;
  for (let m = 1; m <= 40; m++) {
    const n = 2 + Math.floor(rand() * 3);
    for (let k = 0; k < n; k++) {
      const price = Math.round((12 + rand() * 90) * 10) / 10;
      skuStmt.run([skuId++, m, `商品${skuId}`, price, pick(rand, cats)]);
    }
  }
  skuStmt.free();

  db.run(`
    INSERT INTO campaigns VALUES
      (1, '开学满减', '2026-08-10', '2026-08-12', '满减', 420000),
      (2, '达人直播', '2026-07-01', '2026-07-31', '达人', 180000),
      (3, '新客券', '2026-06-01', '2026-08-31', '券', 260000),
      (4, '周末翻倍', '2026-08-01', '2026-08-31', '满减', 90000);
  `);

  const statuses = [
    ...Array(14).fill("paid"),
    ...Array(3).fill("cancelled"),
    ...Array(2).fill("created"),
    "refunded",
  ] as string[];

  const orderStmt = db.prepare("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  const itemStmt = db.prepare("INSERT INTO order_items VALUES (?, ?, ?, ?)");
  const skuCount = skuId - 1;

  for (let oid = 1; oid <= 480; oid++) {
    const uid = 1 + Math.floor(rand() * 90);
    const mid = 1 + Math.floor(rand() * 40);
    const day = Math.floor(rand() * span);
    const status = pick(rand, statuses);
    const base = 18 + rand() * 110;
    const pay = status === "paid" || status === "refunded" ? Math.round(base * 10) / 10 : 0;
    const ch = pick(rand, channels);
    const camp = rand() < 0.35 ? 1 + Math.floor(rand() * 4) : null;
    const city = pick(rand, cities);
    orderStmt.run([oid, uid, mid, dateAt(start, day, rand), status, pay, ch, camp, city]);
    const lines = 1 + Math.floor(rand() * 3);
    let remain = pay || 20 + rand() * 40;
    for (let L = 0; L < lines; L++) {
      const sid = 1 + Math.floor(rand() * skuCount);
      const qty = 1 + Math.floor(rand() * 2);
      const price = Math.round((remain / (lines - L)) * 10) / 10;
      remain = Math.max(1, remain - price);
      itemStmt.run([oid, sid, qty, price]);
    }
  }
  orderStmt.free();
  itemStmt.free();

  const eventNames = ["open_app", "view_merchant", "add_cart", "create_order", "pay_success"];
  const evStmt = db.prepare("INSERT INTO events VALUES (?, ?, ?, ?, ?)");
  let eid = 1;
  for (let i = 0; i < 2600; i++) {
    const uid = 1 + Math.floor(rand() * 90);
    const day = Math.floor(rand() * span);
    const name = pick(rand, eventNames);
    const mid = 1 + Math.floor(rand() * 40);
    evStmt.run([eid++, uid, dateAt(start, day, rand), name, mid]);
  }
  evStmt.free();
}

type InitSqlJs = (config: { locateFile: (file: string) => string }) => Promise<{
  Database: new () => Database;
}>;

async function loadInitSqlJs(): Promise<InitSqlJs> {
  const mod = (await import("sql.js")) as unknown;
  if (typeof mod === "function") return mod as InitSqlJs;
  const boxed = mod as { default?: InitSqlJs };
  if (typeof boxed.default === "function") return boxed.default;
  throw new Error("无法加载 SQL 引擎");
}

export async function getDb(): Promise<Database> {
  if (cached) return cached;
  if (!loading) {
    loading = (async () => {
      const initSqlJs = await loadInitSqlJs();
      const SQL = await initSqlJs({
        locateFile: () => wasmUrl,
      });
      const db = new SQL.Database();
      seed(db);
      cached = db;
      return db;
    })();
  }
  return loading;
}

export type Grid = { columns: string[]; rows: unknown[][] };

export function execSql(db: Database, sql: string): Grid {
  const result: QueryExecResult[] = db.exec(sql);
  if (!result.length) return { columns: [], rows: [] };
  return { columns: result[0].columns, rows: result[0].values };
}

function fingerprint(grid: Grid): string {
  const rows = grid.rows.map((r) =>
    JSON.stringify(
      r.map((v) => (typeof v === "number" ? Math.round(v * 1000) / 1000 : v)),
    ),
  );
  rows.sort();
  return `${grid.rows.length}|${rows.join(";")}`;
}

export function checkQuery(db: Database, student: string, expected: string): {
  ok: boolean;
  message: string;
  grid: Grid;
} {
  let grid: Grid = { columns: [], rows: [] };
  try {
    grid = execSql(db, student);
  } catch (e) {
    return { ok: false, message: `SQL 报错：${(e as Error).message}`, grid };
  }
  try {
    const exp = execSql(db, expected);
    if (fingerprint(grid) === fingerprint(exp)) {
      return { ok: true, message: "结果与参考查询一致。", grid };
    }
    return {
      ok: false,
      message: `跑通了，但结果与参考不完全一致（你 ${grid.rows.length} 行，参考 ${exp.rows.length} 行）。可以对着提示改条件 / 排序 / 去重。`,
      grid,
    };
  } catch (e) {
    return { ok: false, message: `参考查询异常：${(e as Error).message}`, grid };
  }
}
