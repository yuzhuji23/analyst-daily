import { ChannelType, WebR } from "webr";
import type { Grid } from "./sqlEngine";

export const R_SCHEMA_TEXT = `已加载同一套生活服务 App 的三张表（比 SQL 实验室小，方便盯着看）：

users  12 人
  user_id, register_dt, city, channel, gender
  城市：杭州 / 上海 / 北京
  渠道：达人 / 信息流 / 自然量

orders  24 单
  order_id, user_id, merchant_id, order_dt,
  status, pay_amount, channel, city
  status：paid / cancelled / created / refunded
  有两笔 paid 的 pay_amount 是 NA（对账没回来）

events  12 条
  event_id, user_id, event_dt, event_name
  event_name：impression / click

先 head(users)、head(orders) 看一眼再算。
最后一行要写出结果（表或数字），不要只赋值。`;

const SEED = `
options(stringsAsFactors = FALSE)
users <- data.frame(
  user_id = 1:12,
  register_dt = c(
    "2026-05-03","2026-05-08","2026-05-12","2026-05-20",
    "2026-06-01","2026-06-05","2026-06-18","2026-07-02",
    "2026-07-09","2026-07-15","2026-07-22","2026-08-01"
  ),
  city = c("杭州","上海","杭州","北京","上海","杭州","北京","杭州","上海","北京","杭州","上海"),
  channel = c("达人","信息流","信息流","达人","达人","自然量","信息流","达人","自然量","达人","信息流","达人"),
  gender = c("F","M","F","M","F","M","F","F","M","F","M","F")
)
orders <- data.frame(
  order_id = 1:24,
  user_id = c(1,1,2,2,3,3,4,5,5,6,6,7,8,8,9,10,11,11,12,1,4,2,7,10),
  merchant_id = c(1,2,1,3,1,2,4,1,3,2,1,4,1,2,3,4,1,2,3,1,4,1,4,4),
  order_dt = c(
    "2026-06-01","2026-06-08","2026-06-02","2026-06-10",
    "2026-06-03","2026-06-12","2026-06-04","2026-06-15",
    "2026-07-01","2026-06-20","2026-07-03","2026-07-05",
    "2026-07-10","2026-07-18","2026-07-12","2026-07-20",
    "2026-07-25","2026-08-02","2026-08-05","2026-08-08",
    "2026-08-10","2026-08-12","2026-08-15","2026-08-18"
  ),
  status = c(
    "paid","paid","paid","cancelled","paid","created","paid","paid",
    "paid","paid","cancelled","paid","paid","paid","paid","paid",
    "paid","created","paid","paid","refunded","paid","paid","paid"
  ),
  pay_amount = c(
    52,68,38,90,29,55,186,94,
    NA,44,30,41,71,83,58,172,
    33,40,91,60,186,35,NA,165
  ),
  channel = c(
    "达人","达人","信息流","信息流","信息流","信息流","达人","达人",
    "达人","自然量","自然量","信息流","达人","达人","自然量","达人",
    "信息流","信息流","达人","达人","达人","信息流","信息流","达人"
  ),
  city = c(
    "杭州","杭州","上海","上海","杭州","杭州","北京","上海",
    "上海","杭州","杭州","北京","杭州","杭州","上海","北京",
    "杭州","杭州","上海","杭州","北京","上海","北京","北京"
  )
)
events <- data.frame(
  event_id = 1:12,
  user_id = c(1,1,2,3,3,5,8,8,11,4,4,12),
  event_dt = c(
    "2026-06-01","2026-06-01","2026-06-02","2026-06-03",
    "2026-06-03","2026-06-15","2026-07-10","2026-07-10",
    "2026-07-25","2026-06-04","2026-06-04","2026-08-05"
  ),
  event_name = c(
    "impression","click","impression","impression","click","impression",
    "impression","click","impression","impression","click","impression"
  )
)
.users0 <- users
.orders0 <- orders
.events0 <- events
.lab_reset <- function() {
  users <<- .users0
  orders <<- .orders0
  events <<- .events0
  invisible(NULL)
}
.lab_run <- function(code) {
  .lab_reset()
  e <- new.env(parent = .GlobalEnv)
  e$users <- users
  e$orders <- orders
  e$events <- events
  expr <- parse(text = code)
  if (length(expr) == 0) stop("还没写代码。")
  val <- NULL
  for (i in seq_along(expr)) {
    val <- eval(expr[[i]], envir = e)
  }
  val
}
.lab_fp <- function(x) {
  if (is.null(x)) return("__null__")
  if (inherits(x, "htest")) {
    x <- data.frame(p_value = round(unname(x$p.value), 4))
  } else if (is.atomic(x) && is.null(dim(x))) {
    x <- data.frame(value = as.vector(x), stringsAsFactors = FALSE)
  } else if (!is.data.frame(x)) {
    x <- tryCatch(as.data.frame(x, stringsAsFactors = FALSE), error = function(err) {
      data.frame(value = paste(as.character(x), collapse = ","), stringsAsFactors = FALSE)
    })
  }
  if (!nrow(x)) return("__empty__")
  for (nm in names(x)) {
    col <- x[[nm]]
    if (is.numeric(col)) col <- round(as.numeric(col), 4)
    x[[nm]] <- ifelse(is.na(col), "NA", as.character(col))
  }
  if (nrow(x) > 1L) x <- x[do.call(order, x), , drop = FALSE]
  rownames(x) <- NULL
  paste(capture.output(write.table(x, sep = "|", row.names = FALSE, quote = FALSE)), collapse = "\\n")
}
invisible(NULL)
`;

const CAPTURE_OPTS = {
  withAutoprint: true,
  captureGraphics: { width: 720, height: 400, bg: "#fffcf7" } as const,
  throwJsException: true,
};

type WebRHandle = WebR;

let cached: WebRHandle | null = null;
let loading: Promise<WebRHandle> | null = null;

function webrBaseUrl() {
  const page = window.location.href.split("#")[0];
  return new URL(`${import.meta.env.BASE_URL}webr/`, page).href;
}

export type RRun = {
  grid: Grid;
  output: string;
  images: ImageBitmap[];
};

function asError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function formatOutput(rows: { type: string; data: unknown }[]): string {
  return rows
    .filter((r) => r.type === "stdout" || r.type === "stderr")
    .map((r) => String(r.data ?? ""))
    .join("\n")
    .trim();
}

type JsNode = {
  type?: string;
  names?: (string | null)[] | null;
  values?: unknown[];
  value?: unknown;
};

function colValues(col: unknown): unknown[] {
  if (col && typeof col === "object" && "values" in col) {
    return (col as { values: unknown[] }).values ?? [];
  }
  if (Array.isArray(col)) return col;
  return [col];
}

function jsToGrid(js: unknown): Grid {
  if (js == null) return { columns: [], rows: [] };
  if (typeof js !== "object") return { columns: ["value"], rows: [[js]] };
  const node = js as JsNode;
  if (node.type === "null") return { columns: [], rows: [] };
  if (node.type === "string" && "value" in node) {
    return { columns: ["value"], rows: [[node.value]] };
  }
  if (
    node.type === "double" ||
    node.type === "integer" ||
    node.type === "character" ||
    node.type === "logical"
  ) {
    const vals = Array.isArray(node.values) ? node.values : [];
    return { columns: ["value"], rows: vals.map((v) => [v]) };
  }
  if ((node.type === "list" || node.type === "pairlist") && Array.isArray(node.values)) {
    const cols = (node.names ?? node.values.map((_, i) => `V${i + 1}`)).map((n, i) => n || `V${i + 1}`);
    const series = node.values.map(colValues);
    const n = Math.max(0, ...series.map((s) => s.length));
    const rows: unknown[][] = [];
    for (let i = 0; i < n; i++) rows.push(series.map((s) => (i < s.length ? s[i] : null)));
    return { columns: cols, rows };
  }
  if (Array.isArray(js)) {
    if (!js.length) return { columns: [], rows: [] };
    if (js[0] && typeof js[0] === "object" && !Array.isArray(js[0])) {
      const columns = Object.keys(js[0] as object);
      return { columns, rows: (js as Record<string, unknown>[]).map((r) => columns.map((c) => r[c])) };
    }
    return { columns: ["value"], rows: js.map((v) => [v]) };
  }
  return { columns: ["value"], rows: [[JSON.stringify(js)]] };
}

async function resultToGrid(result: unknown): Promise<Grid> {
  const obj = result as {
    toD3?: () => Promise<unknown>;
    toJs?: (opts?: { depth: number }) => Promise<unknown>;
  };
  if (typeof obj.toD3 === "function") {
    try {
      const rows = await obj.toD3();
      if (Array.isArray(rows) && rows.length && typeof rows[0] === "object") {
        return jsToGrid(rows);
      }
    } catch {
      /* not a data.frame */
    }
  }
  if (typeof obj.toJs === "function") {
    try {
      return jsToGrid(await obj.toJs({ depth: -1 }));
    } catch {
      try {
        return jsToGrid(await obj.toJs());
      } catch {
        return { columns: [], rows: [] };
      }
    }
  }
  return { columns: [], rows: [] };
}

async function seed(webR: WebRHandle) {
  await webR.evalRVoid(SEED);
}

export async function getWebR(): Promise<WebRHandle> {
  if (cached) return cached;
  if (!loading) {
    loading = (async () => {
      const webR = new WebR({
        baseUrl: webrBaseUrl(),
        channelType: ChannelType.PostMessage,
        interactive: false,
      });
      await webR.init();
      await seed(webR);
      cached = webR;
      return webR;
    })();
  }
  return loading;
}

export async function execR(code: string): Promise<RRun> {
  const webR = await getWebR();
  const shelter = await new webR.Shelter();
  try {
    await webR.evalRVoid(".lab_reset()");
    const capture = await shelter.captureR(code, CAPTURE_OPTS);
    const grid = await resultToGrid(capture.result);
    return {
      grid,
      output: formatOutput(capture.output),
      images: capture.images ?? [],
    };
  } finally {
    await shelter.purge();
  }
}

export async function checkR(
  student: string,
  expected: string,
): Promise<{ ok: boolean; message: string; run: RRun }> {
  const empty: RRun = { grid: { columns: [], rows: [] }, output: "", images: [] };
  if (!student.trim()) {
    return { ok: false, message: "还没写代码。", run: empty };
  }
  const webR = await getWebR();
  let run: RRun = empty;
  try {
    run = await execR(student);
  } catch (e) {
    return { ok: false, message: `R 报错：${asError(e)}`, run };
  }
  try {
    const ok = await webR.evalRBoolean(`
      isTRUE(identical(
        .lab_fp(.lab_run(${JSON.stringify(student)})),
        .lab_fp(.lab_run(${JSON.stringify(expected)}))
      ))
    `);
    if (ok) {
      return { ok: true, message: "结果和参考一致。", run };
    }
    return {
      ok: false,
      message: "跑通了，但结果和参考不完全一致。看筛选条件、下标是不是从 1 开始、NA 有没有处理、最后一行有没有写出那张表。",
      run,
    };
  } catch (e) {
    return { ok: false, message: `核对失败：${asError(e)}`, run };
  }
}
