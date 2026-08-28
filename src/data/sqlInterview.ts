import type { Lesson } from "../types";

export const SQL_INTERVIEW: Lesson[] = [
  {
    id: "sql-13",
    track: "sql",
    order: 13,
    title: "去重：DISTINCT 最容易假装做对",
    minutes: 12,
    summary: "面试常问「有多少人下了单」。写 COUNT(*) 和 COUNT(DISTINCT user_id) 差的不是语法，是你有没有在数人。",
    blocks: [
      {
        type: "p",
        text: "一张订单表里，同一个人可以有十单。问「多少人买过」，数行数会把一个人当成十个人。问「多少单」，才数行。先问面试官：要的是人，还是单。",
      },
      {
        type: "sql",
        code: "SELECT\n  COUNT(*) AS paid_orders,\n  COUNT(DISTINCT user_id) AS paid_users\nFROM orders\nWHERE status = 'paid';",
      },
      {
        type: "ul",
        items: [
          "COUNT(*) 数行：几笔订单",
          "COUNT(DISTINCT user_id) 数人：几个人买过",
          "JOIN 商品明细后再 COUNT(*)，行会被放大，人必须 DISTINCT",
        ],
      },
      {
        type: "callout",
        title: "开口",
        text: "「我先确认你要人数还是单量。」这句话能挡住一半陷阱题。",
      },
    ],
    quiz: [
      {
        id: "sql-13-q1",
        prompt: "老板要「支付用户数」，订单表一人多单，你写 COUNT(*)，结果会？",
        options: ["刚好是人数", "偏大，把同一人的多单算成多人", "偏小", "语法报错"],
        answer: 1,
        why: "行数是单，不是人。人数要用 DISTINCT 用户。",
      },
      {
        id: "sql-13-q2",
        prompt: "JOIN 了 order_items 再 SUM(pay_amount)，最常见事故是？",
        options: [
          "金额变少",
          "一单多件商品会让金额被加好几遍",
          "一定变快",
          "DISTINCT 会自动修好",
        ],
        answer: 1,
        why: "金额留在订单表上汇总，或先把明细聚合成一单再拼。",
      },
    ],
    lab: {
      id: "sql-13-lab",
      title: "支付订单数 vs 支付用户数",
      prompt: "status='paid'，同时给出订单数 paid_orders、去重用户数 paid_users。",
      hint: "COUNT(*) 和 COUNT(DISTINCT user_id)。",
      starter: "SELECT COUNT(*) AS paid_orders\nFROM orders\nWHERE status = 'paid';",
      expectedSql:
        "SELECT COUNT(*) AS paid_orders, COUNT(DISTINCT user_id) AS paid_users FROM orders WHERE status = 'paid';",
    },
  },
  {
    id: "sql-14",
    track: "sql",
    order: 14,
    title: "空值：NULL 不是 0，比较会「消失」",
    minutes: 12,
    summary: "WHERE city != '杭州' 不会带上城市为空的行。面试官爱用这一题看你有没有碰过脏数据。",
    blocks: [
      {
        type: "p",
        text: "表里有的格子是空的，叫 NULL。它不是 0，也不是空字符串。和它对等、比较，结果都不是真也不是假，于是这行在 WHERE 里直接被丢掉。",
      },
      {
        type: "sql",
        code: "SELECT COUNT(*) AS not_hangzhou\nFROM users\nWHERE city IS NOT NULL AND city <> '杭州';\n\n-- 空城市要单独数\nSELECT COUNT(*) AS missing_city\nFROM users\nWHERE city IS NULL;",
      },
      {
        type: "ul",
        items: [
          "判断空用 IS NULL / IS NOT NULL，不要写 = NULL",
          "SUM 会自动跳过空；把空当 0 要用 COALESCE(x, 0)",
          "LEFT JOIN 对不上时，右表字段全是空，正好用来找「注册了从没下单」",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-14-q1",
        prompt: "WHERE city != '杭州'，城市为空的用户会？",
        options: ["算进结果", "被丢掉，因为空值比较不成立", "报错", "被当成杭州"],
        answer: 1,
        why: "空值参与比较，整行在 WHERE 里消失。要的话得写 IS NULL 或先补上。",
      },
      {
        id: "sql-14-q2",
        prompt: "找「有用户、没有订单」该怎么拼？",
        options: [
          "INNER JOIN orders",
          "users LEFT JOIN orders，再筛 order_id IS NULL",
          "WHERE orders.pay_amount = 0",
          "UNION 两张表",
        ],
        answer: 1,
        why: "先留住所有用户，对不上的订单侧就是空。",
      },
    ],
  },
  {
    id: "sql-15",
    track: "sql",
    order: 15,
    title: "HAVING：先分组，再筛组",
    minutes: 10,
    summary: "WHERE 管每一行，HAVING 管分完组以后的结果。要「下过 3 单以上的人」，必须分组后再筛。",
    blocks: [
      {
        type: "p",
        text: "你不能在 WHERE 里写 COUNT(*) > 3，因为那时候还没按人加总。先 GROUP BY 用户，再 HAVING 订单数大于 3。像先把每个人的作业收齐，再看谁交了三份以上。",
      },
      {
        type: "sql",
        code: "SELECT user_id, COUNT(*) AS paid_cnt\nFROM orders\nWHERE status = 'paid'\nGROUP BY user_id\nHAVING COUNT(*) >= 3\nORDER BY paid_cnt DESC;",
      },
      {
        type: "callout",
        title: "口诀",
        text: "行的条件放 WHERE，组的条件放 HAVING。先过滤行，再分组，再过滤组。",
      },
    ],
    quiz: [
      {
        id: "sql-15-q1",
        prompt: "要支付成功至少 3 单的用户，COUNT(*) >= 3 应该放？",
        options: ["WHERE", "HAVING", "JOIN 里", "SELECT 里当别名再 WHERE 别名"],
        answer: 1,
        why: "聚合之后才能比次数。标准写法是 HAVING COUNT(*) >= 3。",
      },
    ],
    lab: {
      id: "sql-15-lab",
      title: "至少 2 笔支付的用户",
      prompt: "status='paid'，按 user_id 分组，只留支付次数 >= 2 的人，给出 user_id 和 paid_cnt。",
      hint: "GROUP BY user_id + HAVING COUNT(*) >= 2。",
      starter: "SELECT user_id, COUNT(*) AS paid_cnt\nFROM orders\nWHERE status = 'paid'\nGROUP BY user_id;",
      expectedSql:
        "SELECT user_id, COUNT(*) AS paid_cnt FROM orders WHERE status = 'paid' GROUP BY user_id HAVING COUNT(*) >= 2 ORDER BY paid_cnt DESC;",
    },
  },
  {
    id: "sql-16",
    track: "sql",
    order: 16,
    title: "每组取前几名：窗口后再过滤",
    minutes: 14,
    summary: "每个城市成交额最高的 3 个商家——面试高频。先在组里编号，再留下编号小于等于 3 的。",
    blocks: [
      {
        type: "p",
        text: "GROUP BY 只能给每个城市一个汇总。你要的是「每个城市里的前三名」，得先在城市内部排名，再切。",
      },
      {
        type: "sql",
        code: "WITH gmv AS (\n  SELECT city, merchant_id, SUM(pay_amount) AS gmv\n  FROM orders\n  WHERE status = 'paid'\n  GROUP BY city, merchant_id\n),\nranked AS (\n  SELECT *,\n         ROW_NUMBER() OVER (PARTITION BY city ORDER BY gmv DESC) AS rk\n  FROM gmv\n)\nSELECT city, merchant_id, gmv, rk\nFROM ranked\nWHERE rk <= 3\nORDER BY city, rk;",
      },
      {
        type: "ul",
        items: [
          "ROW_NUMBER：并列也硬排 1、2、3，结果稳定，面试优先",
          "RANK：并列会跳号（1、1、3）",
          "先汇总再排名，不要在原始订单行上直接排",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-16-q1",
        prompt: "每个城市 Top 3 商家，最稳的做法是？",
        options: [
          "ORDER BY gmv 然后 LIMIT 3",
          "城市内 ROW_NUMBER，再 WHERE rk <= 3",
          "HAVING MAX(gmv)",
          "DISTINCT city",
        ],
        answer: 1,
        why: "LIMIT 3 只给全表前三，不是每个城市各三。",
      },
    ],
  },
  {
    id: "sql-17",
    track: "sql",
    order: 17,
    title: "连续活跃：日期减去排名",
    minutes: 14,
    summary: "连续登录天数是面试经典。窍门：日期减去「第几次出现」的序号，连续的日子会掉进同一个桶。",
    blocks: [
      {
        type: "p",
        text: "人话版：小明 1、2、3 号都来了。给他编 1、2、3 号。用日期去减序号，三天都会得到同一个「桶」。断了一天，桶就变了。按桶一数，就是连续了几天。",
      },
      {
        type: "sql",
        code: "WITH d AS (\n  SELECT DISTINCT user_id, DATE(event_dt) AS dt\n  FROM events\n),\nmarked AS (\n  SELECT user_id, dt,\n         DATE(dt, '-' || (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY dt) - 1) || ' day') AS grp\n  FROM d\n)\nSELECT user_id, grp, COUNT(*) AS consecutive_days\nFROM marked\nGROUP BY user_id, grp\nHAVING COUNT(*) >= 3;",
      },
      {
        type: "callout",
        title: "现场",
        text: "写不出完整 SQL 也要先讲思路：去重到「人+天」→ 编号 → 日期减编号成组 → 数组长度。面试官听的是这条链。",
      },
    ],
    quiz: [
      {
        id: "sql-17-q1",
        prompt: "算连续天数，为什么先 DISTINCT 到「用户 + 日期」？",
        options: [
          "为了好看",
          "同一天刷十次仍是活跃一天，不先去重会把连续算崩",
          "DISTINCT 能代替窗口函数",
          "日期格式必须如此",
        ],
        answer: 1,
        why: "连续活跃看的是「哪几天来过」，不是来了多少次。",
      },
    ],
  },
  {
    id: "sql-18",
    track: "sql",
    order: 18,
    title: "复购：第二次从哪来",
    minutes: 12,
    summary: "复购不是「订单数大于 1」这么糊。面试要你定义：同一人第二笔支付，离第一笔隔了多久。",
    blocks: [
      {
        type: "p",
        text: "先给每个用户的支付单编号。第 1 单是首单，第 2 单才叫复购。两单日期一减，就是隔了多久。不要把同一天拆成的两笔餐，随口叫成长复购——先跟面试官对齐定义。",
      },
      {
        type: "sql",
        code: "WITH paid AS (\n  SELECT user_id, order_dt,\n         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_dt, order_id) AS rn\n  FROM orders\n  WHERE status = 'paid'\n)\nSELECT\n  COUNT(DISTINCT CASE WHEN rn = 1 THEN user_id END) AS first_buyers,\n  COUNT(DISTINCT CASE WHEN rn = 2 THEN user_id END) AS second_buyers\nFROM paid;",
      },
      {
        type: "ul",
        items: [
          "复购率常见口径：有第 2 单的人 / 有第 1 单的人",
          "时间窗要说清：7 天内复购，还是历史内曾经复购",
          "开口先定义，再写编号",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-18-q1",
        prompt: "把「订单数 > 1 的人」直接叫复购用户，风险是？",
        options: [
          "没有风险",
          "没说清是第几次、隔多久；同一天两单和隔三个月再买被混成一种人",
          "SQL 会报错",
          "人数会变少",
        ],
        answer: 1,
        why: "复购是定义题。先对齐第几单、多长窗口，再计数。",
      },
    ],
    lab: {
      id: "sql-18-lab",
      title: "每人第几笔支付",
      prompt: "支付成功订单，按用户、时间编号 rn，查出 user_id、order_id、rn。",
      hint: "ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_dt, order_id)。",
      starter: "SELECT user_id, order_id, order_dt\nFROM orders\nWHERE status = 'paid';",
      expectedSql:
        "SELECT user_id, order_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_dt, order_id) AS rn FROM orders WHERE status = 'paid';",
    },
  },
  {
    id: "sql-19",
    track: "sql",
    order: 19,
    title: "新老客拆成交：面试必画的一张表",
    minutes: 14,
    summary: "成交涨了，要能当场拆：新客人带来的，还是老客人带来的。拆不开，面试官会认为你只会报总数。",
    blocks: [
      {
        type: "p",
        text: "先给每个用户找到首单日期。看某一周的订单时：如果这周一单的人，首单就在这周，算新客成交；首单更早，算老客成交。",
      },
      {
        type: "sql",
        code: "WITH first_dt AS (\n  SELECT user_id, MIN(DATE(order_dt)) AS first_dt\n  FROM orders\n  WHERE status = 'paid'\n  GROUP BY user_id\n)\nSELECT\n  CASE WHEN DATE(o.order_dt) = f.first_dt THEN '新客' ELSE '老客' END AS tag,\n  COUNT(*) AS orders,\n  SUM(o.pay_amount) AS gmv\nFROM orders o\nJOIN first_dt f ON o.user_id = f.user_id\nWHERE o.status = 'paid'\nGROUP BY 1;",
      },
      {
        type: "callout",
        title: "开口",
        text: "「我按用户首单日切新老，再看这一周的金额分别来自哪边。」比直接说「新客好了」像分析师。",
      },
    ],
    quiz: [
      {
        id: "sql-19-q1",
        prompt: "本周成交涨、新客成交掉、老客成交涨，更像？",
        options: [
          "拉新大胜",
          "增长靠老客在撑，拉新在变弱",
          "数据一定错",
          "只要看总数",
        ],
        answer: 1,
        why: "总数会把两种故事盖住。面试就要你会拆。",
      },
    ],
  },
  {
    id: "sql-20",
    track: "sql",
    order: 20,
    title: "JOIN 放大：数人必须先收束",
    minutes: 12,
    summary: "一对多一拼，行数会炸。面试爱问「这段 SQL 的 GMV 为什么比报表大一倍」。",
    blocks: [
      {
        type: "p",
        text: "一笔订单两件商品，JOIN 明细后变成两行，每行还带着整单金额。你再 SUM，金额翻倍。正确做法：金额在订单表加总；或者先把明细聚合成「一单一行」再拼。",
      },
      {
        type: "sql",
        code: "-- 金额在订单粒度加总，不要从明细加整单金额\nSELECT o.city, SUM(o.pay_amount) AS gmv\nFROM orders o\nWHERE o.status = 'paid'\nGROUP BY o.city;\n\n-- 要看件数再开明细，件数用 qty，不要拿 pay_amount 在明细上 SUM",
      },
      {
        type: "ul",
        items: [
          "拼表前问：会不会一对多？",
          "一对多之后数人：COUNT(DISTINCT user_id)",
          "一对多之后加金额：回到一单一行再加",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-20-q1",
        prompt: "订单 JOIN 多件商品明细后再 SUM(pay_amount)，通常会？",
        options: ["不变", "偏大", "偏小", "变成 0"],
        answer: 1,
        why: "整单金额被复制到每一件商品上再加总。",
      },
    ],
  },
  {
    id: "sql-21",
    track: "sql",
    order: 21,
    title: "对照：有活动 vs 没活动",
    minutes: 12,
    summary: "运营说活动成功。你要会取「活动碰到的单」和「没碰到的单」，而不是只报活动窗里的总数。",
    blocks: [
      {
        type: "p",
        text: "活动窗里的成交，混着本来就会买的人。最低限度：标出订单有没有带活动，再并排看单量、人数、一单多少钱。更好是留一群人看不到活动——那是后面实验课的事。",
      },
      {
        type: "sql",
        code: "SELECT\n  CASE WHEN campaign_id IS NOT NULL THEN '活动单' ELSE '非活动单' END AS tag,\n  COUNT(*) AS orders,\n  COUNT(DISTINCT user_id) AS users,\n  AVG(pay_amount) AS aov\nFROM orders\nWHERE status = 'paid'\nGROUP BY 1;",
      },
    ],
    quiz: [
      {
        id: "sql-21-q1",
        prompt: "只把活动期间总成交拿去证明活动成功，错在哪？",
        options: [
          "没错",
          "里面有大量本来就会买的单，没有对照就不知道活动多带来了什么",
          "时间窗不能用",
          "SQL 写不了对照",
        ],
        answer: 1,
        why: "没有对照，热闹和增量分不清。",
      },
    ],
    lab: {
      id: "sql-21-lab",
      title: "有无活动的支付单量",
      prompt: "支付成功订单，按有无 campaign_id 分成两组，统计订单数。",
      hint: "CASE WHEN campaign_id IS NOT NULL ... GROUP BY 1。",
      starter: "SELECT campaign_id, COUNT(*) AS orders\nFROM orders\nWHERE status = 'paid'\nGROUP BY campaign_id;",
      expectedSql:
        "SELECT CASE WHEN campaign_id IS NOT NULL THEN '活动单' ELSE '非活动单' END AS tag, COUNT(*) AS orders FROM orders WHERE status = 'paid' GROUP BY 1;",
    },
  },
  {
    id: "sql-22",
    track: "sql",
    order: 22,
    title: "现场写次日留存",
    minutes: 15,
    summary: "面试官说「算一下次日留存」，你要 3 分钟内讲清口径并写出骨架。",
    blocks: [
      {
        type: "p",
        text: "口径先说出口：哪一天进来的人当队列，第二天还来过（任意行为或打开）就算留。不要一上来写。说完再写：队列日期、第二天日期、人数、还来的人数、相除。",
      },
      {
        type: "sql",
        code: "WITH first_day AS (\n  SELECT user_id, MIN(DATE(event_dt)) AS d0\n  FROM events\n  GROUP BY user_id\n),\nback AS (\n  SELECT DISTINCT f.user_id, f.d0\n  FROM first_day f\n  JOIN events e\n    ON e.user_id = f.user_id\n   AND DATE(e.event_dt) = DATE(f.d0, '+1 day')\n)\nSELECT f.d0,\n       COUNT(*) AS cohort,\n       COUNT(b.user_id) AS d1,\n       ROUND(1.0 * COUNT(b.user_id) / COUNT(*), 4) AS d1_rate\nFROM first_day f\nLEFT JOIN back b ON f.user_id = b.user_id\nGROUP BY f.d0\nORDER BY f.d0;",
      },
      {
        type: "callout",
        title: "加分",
        text: "写完补一句：还要按渠道切开，避免差渠道把大盘拉垮。面试官要听的就是这句。",
      },
    ],
    quiz: [
      {
        id: "sql-22-q1",
        prompt: "次日留存的分母应该是？",
        options: ["当天所有事件数", "队列里的人数", "第二天事件数", "订单数"],
        answer: 1,
        why: "留存是人的比例：第二天还来的人 / 当天这批人。",
      },
    ],
  },
  {
    id: "sql-23",
    track: "sql",
    order: 23,
    title: "指标下跌：取数顺序比写法重要",
    minutes: 12,
    summary: "「DAU 跌了你怎么查」一半是商业拆法，一半是你会按顺序取哪几张表。",
    blocks: [
      {
        type: "p",
        text: "不要一上来写超长 SQL。开口顺序：1）口径有没有改（统计是不是换了）；2）新老客谁在跌；3）哪条渠道、哪座城市；4）是打开少了还是打开后不往下走。每一步对应一张小表，不要妄想一条 SQL 查完世界。",
      },
      {
        type: "ul",
        items: [
          "第一步：同一口径复算昨天和今天，排除数错",
          "第二步：新客 / 老客 / 回流分开",
          "第三步：渠道、城市、端（手机系统）",
          "第四步：漏斗，看跌在打开、浏览还是支付",
        ],
      },
      {
        type: "callout",
        title: "现场",
        text: "面试官打断「你先查什么」时，答「先复算口径，再拆新老」。比立刻写窗口函数更像熟手。",
      },
    ],
    quiz: [
      {
        id: "sql-23-q1",
        prompt: "日活突然跌，你最先做哪件？",
        options: [
          "立刻改推荐算法",
          "确认口径没变、数能复算出来，再拆新老和渠道",
          "先写一篇周报总结",
          "先问要不要用 Python",
        ],
        answer: 1,
        why: "先排除数错和口径，再谈业务。否则会在错的数上开会。",
      },
    ],
  },
  {
    id: "sql-24",
    track: "sql",
    order: 24,
    title: "把 SQL 讲给面试官听",
    minutes: 12,
    summary: "大厂不只要你会写，还要你会在白板上讲：这句在干什么、坑在哪、下一步看什么。",
    blocks: [
      {
        type: "p",
        text: "讲的顺序固定成四句，比把代码念一遍有用：这题要什么数；口径我怎么定；SQL 分几步；结果出来我会怀疑什么。",
      },
      {
        type: "ul",
        items: [
          "要什么：人数、单量、金额，先说清",
          "口径：时间、状态、是否去重、新老怎么切",
          "步骤：过滤 → 拼表 → 聚合 → 再筛",
          "怀疑：JOIN 有没有放大、空值有没有丢掉、有没有对照",
        ],
      },
      {
        type: "callout",
        title: "第二阶段收官",
        text: "到这里，面试现场最常见的 SQL 坑你都见过了。还差两块：实验怎么谈，以及不会写代码时怎么把题拆开讲。",
      },
    ],
    quiz: [
      {
        id: "sql-24-q1",
        prompt: "面试写完 SQL，最该补的一句是？",
        options: [
          "我语法肯定对",
          "这个数我还会怀疑 JOIN 是否放大、口径是否含退款，下一步想看对照",
          "不用解释",
          "请直接给 offer",
        ],
        answer: 1,
        why: "熟手会主动讲坑。面试官要的是判断，不只是能跑。",
      },
    ],
  },
];
