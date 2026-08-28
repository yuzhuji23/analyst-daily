import type { Lesson } from "../types";

export const SQL_LESSONS: Lesson[] = [
  {
    id: "sql-01",
    track: "sql",
    order: 1,
    title: "先读表：业务表不是作业表",
    minutes: 10,
    summary: "分析岗的 SQL 不是从 SELECT 开始，而是从「这张表记录的是一次什么行为」开始。",
    blocks: [
      {
        type: "p",
        text: "大厂里你每天碰到的不是「学生成绩表」，而是订单、曝光、点击、支付、退款。同一句 COUNT(*)，口径不同，数字可以差一个数量级。入职第一周最常见的事故，不是语法写错，而是把「支付成功订单」当成了「创建订单」。",
      },
      {
        type: "p",
        text: "用人话想：一张表就是一本流水账。你要先知道每一行在记什么事。记的是「来了一个人」，还是「开了一张票」，还是「看了一眼商品」。账本不同，行数不能拿来对打。",
      },
      {
        type: "h",
        text: "一张表要先问的 5 件事",
      },
      {
        type: "ul",
        items: [
          "粒度：一行是一个用户、一笔订单，还是一次曝光？",
          "主体：谁发生了这件事？（user_id / merchant_id）",
          "时间：用创建时间、支付时间，还是分区日期？",
          "状态：有没有取消、失败、测试单要剔除？",
          "口径主人：这个指标归哪个团队定义？有没有指标字典？",
        ],
      },
      {
        type: "callout",
        title: "面试加分句",
        text: "「我先确认粒度再写 SQL。」这句话比你背窗口函数更像分析师。",
      },
      {
        type: "p",
        text: "本平台的实验室模拟一个生活服务 App（外卖 / 到店 / 电商混业）：users 是用户，orders 是订单，events 是行为日志。订单表一行 = 一笔订单；事件表一行 = 一次行为。永远不要把两张表的行数直接当同一个指标。",
      },
    ],
    quiz: [
      {
        id: "sql-01-q1",
        prompt: "orders 表有 100 万行，events 表同一天有 800 万行。哪句更接近事实？",
        options: [
          "当天有 800 万单",
          "当天活跃行为次数远多于订单数，两张表粒度不同，不能直接比行数",
          "events 一定有脏数据，应该以 orders 为准",
          "应该先 UNION 两张表再 COUNT",
        ],
        answer: 1,
        why: "订单是交易粒度，事件是行为粒度。分析前先对齐「一行代表什么」。",
      },
      {
        id: "sql-01-q2",
        prompt: "老板要「昨日 GMV」。你应该先问哪句？",
        options: [
          "用 SUM 还是 COUNT？",
          "GMV 按支付成功金额，还是下单金额？是否含退款、测试单、货到付款？",
          "要不要上窗口函数？",
          "要不要用 Python？",
        ],
        answer: 1,
        why: "指标定义先于写法。支付/下单/是否剔除退款，会直接改数字。",
      },
      {
        id: "sql-01-q3",
        prompt: "下列哪张表的粒度最可能是「一次曝光」？",
        options: ["users", "orders", "events（event_name = impression）", "campaigns"],
        answer: 2,
        why: "曝光、点击通常落在行为日志。用户表一行一人，订单表一行一单。",
      },
    ],
  },
  {
    id: "sql-02",
    track: "sql",
    order: 2,
    title: "SELECT / WHERE：把问题收成一张结果表",
    minutes: 12,
    summary: "分析查询的本质：从大表里切出「谁、在哪、在什么时间、满足什么条件」。",
    blocks: [
      {
        type: "p",
        text: "SELECT 决定你要哪些字段，WHERE 决定哪些行留下，ORDER BY / LIMIT 用来抽查看样。分析师很少 SELECT * 交给老板——老板要的是结论，你自己才需要明细。",
      },
      {
        type: "sql",
        code: "SELECT user_id, city, channel, register_dt\nFROM users\nWHERE city = '上海'\n  AND register_dt >= '2026-06-01'\nORDER BY register_dt DESC\nLIMIT 20;",
      },
      {
        type: "ul",
        items: [
          "等值过滤：city = '上海'、status = 'paid'",
          "范围过滤：日期、金额。日期尽量写 'YYYY-MM-DD'，不要依赖隐式转换",
          "IN / NOT IN：渠道、城市名单。注意 NOT IN 碰上 NULL 会「全没了」",
          "抽样看数：先 LIMIT 50 确认字段长什么样，再聚合",
        ],
      },
      {
        type: "callout",
        title: "先看一眼再汇总",
        text: "先跑 LIMIT 看脏数据，再 SUM。很多离谱指标，LIMIT 一眼就能看出来源是测试账号或时间写错。WHERE 是在筛行：同时满足用 AND，满足一个就行用 OR，复杂时请加括号。",
      },
    ],
    quiz: [
      {
        id: "sql-02-q1",
        prompt: "WHERE status != 'cancelled' 漏掉了 3% 的行，最可能的原因是？",
        options: [
          "JOIN 写错了",
          "status 里有 NULL，NULL 比较不等于任何值",
          "需要窗口函数",
          "表被锁了",
        ],
        answer: 1,
        why: "SQL 里 NULL 表示未知。未知既不等于 cancelled，也不等于「不是 cancelled」。常用 COALESCE(status, 'unknown') 或显式 IS NULL。",
      },
      {
        id: "sql-02-q2",
        prompt: "要抽最近注册的 10 个北京用户，哪句结构对？",
        options: [
          "SELECT * FROM users LIMIT 10 WHERE city='北京'",
          "SELECT * FROM users WHERE city='北京' ORDER BY register_dt DESC LIMIT 10",
          "SELECT TOP city FROM users",
          "SELECT users LIMIT Beijing",
        ],
        answer: 1,
        why: "顺序是 SELECT → FROM → WHERE → ORDER BY → LIMIT。",
      },
    ],
    lab: {
      id: "sql-02-lab",
      title: "找出杭州、通过「达人」渠道注册的用户",
      prompt: "从 users 表取出 city = '杭州' 且 channel = '达人' 的用户，按注册日期从新到旧，最多 30 行。",
      hint: "WHERE 两个条件用 AND；ORDER BY register_dt DESC；LIMIT 30。",
      starter: "SELECT user_id, city, channel, register_dt\nFROM users\nWHERE 1=1\nLIMIT 10;",
      expectedSql:
        "SELECT user_id, city, channel, register_dt FROM users WHERE city = '杭州' AND channel = '达人' ORDER BY register_dt DESC LIMIT 30;",
    },
  },
  {
    id: "sql-03",
    track: "sql",
    order: 3,
    title: "聚合：GMV、订单量、客单价",
    minutes: 12,
    summary: "GROUP BY 是分析岗用得最多的语法。几乎所有日报都是它。",
    blocks: [
      {
        type: "p",
        text: "明细告诉你「发生了什么」，聚合告诉你「规模有多大」。GMV、订单量、客单价、转化率，底层都是 COUNT / SUM / AVG + GROUP BY。",
      },
      {
        type: "sql",
        code: "SELECT\n  city,\n  COUNT(*) AS order_cnt,\n  SUM(pay_amount) AS gmv,\n  AVG(pay_amount) AS aov\nFROM orders\nWHERE status = 'paid'\nGROUP BY city\nORDER BY gmv DESC;",
      },
      {
        type: "ul",
        items: [
          "COUNT(*)：行数。COUNT(user_id) 不数 NULL",
          "COUNT(DISTINCT user_id)：去重人数，算买家数、DAU 常用",
          "SUM / AVG：金额。客单价 AOV = SUM(金额) / COUNT(订单)，不要直接 AVG 再脑补口径",
          "HAVING：对聚合结果再过滤，例如 HAVING SUM(pay_amount) > 10000",
        ],
      },
      {
        type: "callout",
        title: "口径陷阱",
        text: "「客单价」除的是订单数还是人数？「笔单价」和「人单价」差很多。写进注释里。",
      },
    ],
    quiz: [
      {
        id: "sql-03-q1",
        prompt: "要「每个渠道的支付买家数」，哪句对？",
        options: [
          "SELECT channel, COUNT(*) FROM orders GROUP BY channel",
          "SELECT channel, COUNT(DISTINCT user_id) FROM orders WHERE status='paid' GROUP BY channel",
          "SELECT DISTINCT channel, user_id FROM orders",
          "SELECT channel, SUM(user_id) FROM orders",
        ],
        answer: 1,
        why: "买家数是去重用户。COUNT(*) 是订单数，会被复购放大。",
      },
      {
        id: "sql-03-q2",
        prompt: "HAVING 和 WHERE 的差别？",
        options: [
          "没差别",
          "WHERE 过滤行，HAVING 过滤分组之后的聚合结果",
          "HAVING 只能用于日期",
          "WHERE 更慢",
        ],
        answer: 1,
        why: "先 WHERE 再 GROUP BY 再 HAVING。不能在 WHERE 里写 SUM(pay_amount) > 1000。",
      },
    ],
    lab: {
      id: "sql-03-lab",
      title: "分城市看支付 GMV",
      prompt: "只统计 status = 'paid' 的订单，按 city 汇总订单数、GMV、平均客单价，按 GMV 从高到低。",
      hint: "COUNT(*) / SUM(pay_amount) / AVG(pay_amount)，GROUP BY city。",
      starter: "SELECT city\nFROM orders\nLIMIT 5;",
      expectedSql:
        "SELECT city, COUNT(*) AS order_cnt, SUM(pay_amount) AS gmv, AVG(pay_amount) AS aov FROM orders WHERE status = 'paid' GROUP BY city ORDER BY gmv DESC;",
    },
  },
  {
    id: "sql-04",
    track: "sql",
    order: 4,
    title: "JOIN：用户 × 订单 × 商品",
    minutes: 14,
    summary: "业务问题几乎都跨表。JOIN 错了，后面所有看板都是错的。",
    blocks: [
      {
        type: "p",
        text: "用户在 users，钱在 orders，货在 order_items。你要「新用户首单 GMV」，就必须把人、单、时间拼起来。分析岗面试必考 INNER / LEFT JOIN 的行数变化。",
      },
      {
        type: "sql",
        code: "SELECT o.city, COUNT(DISTINCT o.user_id) AS buyers\nFROM orders o\nJOIN users u ON o.user_id = u.user_id\nWHERE o.status = 'paid'\n  AND u.channel = '字节广告'\nGROUP BY o.city;",
      },
      {
        type: "ul",
        items: [
          "INNER JOIN：两边都匹配才保留。没下过单的用户会消失",
          "LEFT JOIN：保留左表全部。算「注册但未下单」必须 LEFT JOIN orders",
          "一对多会放大行数：一个订单多个 SKU，JOIN order_items 后再 SUM 金额容易把 GMV 加爆——金额应在订单表 SUM，或先聚合再 JOIN",
        ],
      },
      {
        type: "callout",
        title: "防翻车",
        text: "JOIN 之后先 COUNT(*) 看行数有没有爆炸，再 SUM。这是资深分析师的肌肉记忆。",
      },
    ],
    quiz: [
      {
        id: "sql-04-q1",
        prompt: "要统计「注册了但从未下单」的用户，应该？",
        options: [
          "users INNER JOIN orders",
          "users LEFT JOIN orders，再 WHERE orders.order_id IS NULL",
          "orders LEFT JOIN users",
          "UNION 两张表",
        ],
        answer: 1,
        why: "LEFT JOIN 保留所有用户，订单为空的就是未下单。INNER 会把他们直接丢掉。",
      },
      {
        id: "sql-04-q2",
        prompt: "订单 JOIN 明细后 GMV 突然翻倍，最常见原因？",
        options: [
          "汇率错了",
          "一对多放大：一单多行明细，对 pay_amount 重复 SUM",
          "城市字段是中文",
          "没有 ORDER BY",
        ],
        answer: 1,
        why: "先在订单粒度汇总，或 SUM(qty*price) 用明细金额，不要对已被复制的订单金额再 SUM。",
      },
    ],
    lab: {
      id: "sql-04-lab",
      title: "达人渠道用户的支付订单数",
      prompt: "关联 users 与 orders，统计 channel = '达人' 的用户里，支付成功订单有多少笔（status='paid'）。",
      hint: "JOIN ON user_id，WHERE 同时过滤渠道和状态，COUNT(*)。",
      starter: "SELECT COUNT(*) AS cnt\nFROM orders o\nJOIN users u ON o.user_id = u.user_id\n;",
      expectedSql:
        "SELECT COUNT(*) AS cnt FROM orders o JOIN users u ON o.user_id = u.user_id WHERE u.channel = '达人' AND o.status = 'paid';",
    },
  },
  {
    id: "sql-05",
    track: "sql",
    order: 5,
    title: "CASE WHEN：分群是运营的语言",
    minutes: 12,
    summary: "数据运营天天要高中低价值、新老客、是否参加活动。CASE WHEN 就是在 SQL 里做分群。",
    blocks: [
      {
        type: "p",
        text: "老板不会问你「把表 dump 出来」。他们问「高价值用户怎么样了」。你要用规则把连续数值切成运营能执行的桶。",
      },
      {
        type: "sql",
        code: "SELECT\n  CASE\n    WHEN pay_amount >= 80 THEN '高客单'\n    WHEN pay_amount >= 30 THEN '中客单'\n    ELSE '低客单'\n  END AS aov_bucket,\n  COUNT(*) AS orders,\n  SUM(pay_amount) AS gmv\nFROM orders\nWHERE status = 'paid'\nGROUP BY 1\nORDER BY gmv DESC;",
      },
      {
        type: "ul",
        items: [
          "分群规则要写进文档，否则下周有人把 80 改成 100，趋势就断了",
          "新老客：下单日期 vs 注册日期，或是否有历史订单",
          "CASE 可以嵌在 SUM 里做条件计数：SUM(CASE WHEN status='paid' THEN 1 ELSE 0 END)",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-05-q1",
        prompt: "SUM(CASE WHEN status='paid' THEN pay_amount ELSE 0 END) 在算什么？",
        options: [
          "所有订单金额",
          "只把支付成功的金额加总，失败单记 0",
          "平均客单价",
          "去重用户数",
        ],
        answer: 1,
        why: "条件聚合：一行里同时算多种口径，不必写多个查询。",
      },
      {
        id: "sql-05-q2",
        prompt: "运营说「高价值 = 近 30 天支付 ≥ 3 单」。这更像？",
        options: [
          "一个可视化颜色",
          "一条可写成 CASE / HAVING 的分群规则，必须版本化",
          "窗口函数的唯一用途",
          "不需要数据",
        ],
        answer: 1,
        why: "分群是产品决策。规则变了，历史对比要重算或冻结版本。",
      },
    ],
    lab: {
      id: "sql-05-lab",
      title: "按客单桶看订单结构",
      prompt: "支付成功订单按金额分成 <30、30–80、≥80 三档，输出每档订单数和 GMV。",
      hint: "CASE WHEN + GROUP BY 分群字段。",
      starter: "SELECT pay_amount\nFROM orders\nWHERE status = 'paid'\nLIMIT 5;",
      expectedSql:
        "SELECT CASE WHEN pay_amount >= 80 THEN '高' WHEN pay_amount >= 30 THEN '中' ELSE '低' END AS bucket, COUNT(*) AS orders, SUM(pay_amount) AS gmv FROM orders WHERE status = 'paid' GROUP BY 1;",
    },
  },
  {
    id: "sql-06",
    track: "sql",
    order: 6,
    title: "时间：日报、环比、活动窗",
    minutes: 12,
    summary: "运营复盘的第一句话永远是「比昨天呢」。时间函数决定你能不能答。",
    blocks: [
      {
        type: "p",
        text: "SQLite 实验室里用 DATE() / STRFTIME()。工作里 Hive / Spark 是 date_trunc、to_date。思想一样：把时间戳折成日/周，再对齐对比。",
      },
      {
        type: "sql",
        code: "SELECT DATE(order_dt) AS dt,\n       COUNT(*) AS orders,\n       SUM(pay_amount) AS gmv\nFROM orders\nWHERE status = 'paid'\n  AND DATE(order_dt) BETWEEN '2026-08-01' AND '2026-08-27'\nGROUP BY 1\nORDER BY 1;",
      },
      {
        type: "ul",
        items: [
          "活动复盘：用活动开始/结束日切窗口，不要用「感觉那一周」",
          "周：注意周起始是周一还是周日，中美团队经常对不上",
          "同比/环比：先按日聚合，再和昨天/上周同一weekday比",
        ],
      },
      {
        type: "callout",
        title: "时区",
        text: "日志常常是 UTC，产品是东八区。日界线错一天，DAU 会整段平移。问清楚再算。",
      },
    ],
    quiz: [
      {
        id: "sql-06-q1",
        prompt: "活动 8/10–8/12，你用 order_dt >= '2026-08-10' AND order_dt < '2026-08-12'，会怎样？",
        options: [
          "刚好三天",
          "丢掉 8/12 当天，活动窗被切短",
          "会多算一天",
          "语法错误",
        ],
        answer: 1,
        why: "右开区间 < 8/12 不含 12 日。闭区间应到 < '2026-08-13' 或 <= '2026-08-12 23:59:59'（更推荐次日零点右开）。",
      },
      {
        id: "sql-06-q2",
        prompt: "日报里「昨天」应该用哪个时间？",
        options: [
          "你打开电脑的本地时间，随便",
          "产品约定的业务时区切日，且与看板一致",
          "一定用 UTC",
          "一定用注册时间",
        ],
        answer: 1,
        why: "和看板、调度任务用同一套业务日期，否则对不齐。",
      },
    ],
    lab: {
      id: "sql-06-lab",
      title: "8 月每日支付订单",
      prompt: "status='paid'，按 DATE(order_dt) 汇总 2026-08-01 至 2026-08-27 的每日订单数。",
      hint: "DATE(order_dt) + BETWEEN + GROUP BY 1。",
      starter: "SELECT DATE(order_dt) AS dt, COUNT(*) AS orders\nFROM orders\nWHERE status = 'paid'\nGROUP BY 1\nORDER BY 1;",
      expectedSql:
        "SELECT DATE(order_dt) AS dt, COUNT(*) AS orders FROM orders WHERE status = 'paid' AND DATE(order_dt) BETWEEN '2026-08-01' AND '2026-08-27' GROUP BY 1 ORDER BY 1;",
    },
  },
  {
    id: "sql-07",
    track: "sql",
    order: 7,
    title: "WITH 子查询：把取数拆成人话",
    minutes: 12,
    summary: "复杂取数不要写成一座括号山。CTE 让你的 SQL 能被别人 review。",
    blocks: [
      {
        type: "p",
        text: "分析岗的 SQL 会被产品、运营、下一个实习生读。可读性就是生产力。WITH 把「先找出目标用户，再算他们的 GMV」写成两步。",
      },
      {
        type: "sql",
        code: "WITH new_users AS (\n  SELECT user_id\n  FROM users\n  WHERE register_dt >= '2026-08-01'\n)\nSELECT COUNT(DISTINCT o.user_id) AS new_buyers,\n       SUM(o.pay_amount) AS gmv\nFROM orders o\nJOIN new_users n ON o.user_id = n.user_id\nWHERE o.status = 'paid';",
      },
      {
        type: "ul",
        items: [
          "一个 CTE 只做一件事：过滤、聚合、或打标签",
          "子查询出现在 FROM / WHERE IN，语义与 CTE 类似，但嵌套深了就难读",
          "面试时边写边说步骤，比一口气炫技更加分",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-07-q1",
        prompt: "WITH 的主要价值是？",
        options: [
          "一定更快",
          "把复杂逻辑拆步，便于检查口径和协作",
          "可以不用 JOIN",
          "只有 Oracle 能用",
        ],
        answer: 1,
        why: "现代引擎对 CTE 不一定物化。你图的是清晰，不是魔法加速。",
      },
      {
        id: "sql-07-q2",
        prompt: "WHERE user_id IN (SELECT user_id FROM users WHERE city='北京') 想表达什么？",
        options: ["北京的订单金额", "只保留北京用户发生的行", "排除北京", "随机抽样"],
        answer: 1,
        why: "IN 子查询是成员过滤。更常见的写法是 JOIN users 再 WHERE city。",
      },
    ],
    lab: {
      id: "sql-07-lab",
      title: "8 月新用户的支付 GMV",
      prompt: "用 WITH 先选出 register_dt >= '2026-08-01' 的用户，再计算他们支付成功订单的 GMV。",
      hint: "WITH new_users AS (... SELECT user_id ...) 再 JOIN orders。",
      starter: "WITH new_users AS (\n  SELECT user_id FROM users WHERE register_dt >= '2026-08-01'\n)\nSELECT * FROM new_users LIMIT 5;",
      expectedSql:
        "WITH new_users AS (SELECT user_id FROM users WHERE register_dt >= '2026-08-01') SELECT SUM(o.pay_amount) AS gmv FROM orders o JOIN new_users n ON o.user_id = n.user_id WHERE o.status = 'paid';",
    },
  },
  {
    id: "sql-08",
    track: "sql",
    order: 8,
    title: "窗口函数：排名、上次下单、累计",
    minutes: 14,
    summary: "窗口函数不合并行，却能看见「这一行在分组里的位置」。留存、复购、排名全靠它。",
    blocks: [
      {
        type: "p",
        text: "GROUP BY 会把多行收成一行。窗口函数 OVER() 保留每一行，同时算组内排名、滞后值、累计和。这是分析岗从「会写报表」到「会做分析」的分水岭。",
      },
      {
        type: "sql",
        code: "SELECT user_id, order_dt, pay_amount,\n       ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_dt) AS rn,\n       LAG(order_dt) OVER (PARTITION BY user_id ORDER BY order_dt) AS prev_dt\nFROM orders\nWHERE status = 'paid';",
      },
      {
        type: "ul",
        items: [
          "ROW_NUMBER()：每个用户第 1 单、第 N 单",
          "LAG / LEAD：上次 / 下次，用来算购买间隔",
          "SUM() OVER (PARTITION BY user_id ORDER BY order_dt)：累计消费",
          "PARTITION BY 相当于「组」，ORDER BY 决定组内顺序",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-08-q1",
        prompt: "要每个用户的首单，最稳的是？",
        options: [
          "MIN(order_dt) 后随便 JOIN 回订单，不管并列",
          "ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_dt, order_id) 取 rn=1",
          "LIMIT 1",
          "AVG(order_dt)",
        ],
        answer: 1,
        why: "同一天多单时，加 order_id 保证稳定首单。只 MIN 日期会留下当天全部订单。",
      },
      {
        id: "sql-08-q2",
        prompt: "LAG 的直观含义？",
        options: ["下一行", "按排序后的上一行的值", "全表最大值", "去重"],
        answer: 1,
        why: "LAG 看历史，LEAD 看未来。买间隔、流失预警常用 LAG。",
      },
    ],
    lab: {
      id: "sql-08-lab",
      title: "标记每个用户的第几单",
      prompt: "对支付成功订单，按用户分区、按下单时间排序，用 ROW_NUMBER 生成 rn，只看 rn 与 user_id、order_id。",
      hint: "ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_dt, order_id)。",
      starter: "SELECT user_id, order_id, order_dt\nFROM orders\nWHERE status = 'paid'\nLIMIT 10;",
      expectedSql:
        "SELECT user_id, order_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_dt, order_id) AS rn FROM orders WHERE status = 'paid';",
    },
  },
  {
    id: "sql-09",
    track: "sql",
    order: 9,
    title: "漏斗：从看到下单丢在哪一层",
    minutes: 12,
    summary: "产品/运营问「转化差」，你要能把路径拆成可计算的台阶。",
    blocks: [
      {
        type: "p",
        text: "漏斗不是一张图，是一串人数。本实验室 events 里有 view_merchant / add_cart / create_order / pay_success。同一用户同一天走过的最高台阶，决定转化。",
      },
      {
        type: "sql",
        code: "SELECT event_name, COUNT(DISTINCT user_id) AS users\nFROM events\nWHERE DATE(event_dt) = '2026-08-20'\nGROUP BY event_name;",
      },
      {
        type: "ul",
        items: [
          "同窗漏斗：同一天或同一次会话内完成",
          "跨天漏斗：7 日内支付，口径要写清",
          "步骤必须互斥或可嵌套：有人支付但日志丢了 view，人数会倒挂——先检查埋点",
        ],
      },
      {
        type: "callout",
        title: "商业思维",
        text: "优化漏斗先找「人数掉得最多且你能改」的那一层。大盘 DAU 波动救不了加购按钮看不清。",
      },
    ],
    quiz: [
      {
        id: "sql-09-q1",
        prompt: "漏斗上层 1 万、下层 1.2 万，说明？",
        options: [
          "转化超过 100%，产品赢了",
          "口径或埋点有问题：窗口不一致，或下层事件可绕过上层",
          "要用 AVG",
          "正常，因为复购",
        ],
        answer: 1,
        why: "严格漏斗应单调不增。倒挂优先查埋点、去重、窗口，而不是做结论。",
      },
      {
        id: "sql-09-q2",
        prompt: "运营想提高支付转化，你应先给什么？",
        options: [
          "一句「用户体验不好」",
          "分步骤人数 + 每一层转化率 + 哪一层绝对流失最多",
          "只给 GMV",
          "只给 DAU",
        ],
        answer: 1,
        why: "漏斗把「转化差」变成可执行的一层。",
      },
    ],
    lab: {
      id: "sql-09-lab",
      title: "各事件去重人数",
      prompt: "统计 events 中每个 event_name 的去重用户数，从高到低。",
      hint: "COUNT(DISTINCT user_id) GROUP BY event_name。",
      starter: "SELECT event_name, COUNT(*) AS cnt\nFROM events\nGROUP BY 1;",
      expectedSql:
        "SELECT event_name, COUNT(DISTINCT user_id) AS users FROM events GROUP BY event_name ORDER BY users DESC;",
    },
  },
  {
    id: "sql-10",
    track: "sql",
    order: 10,
    title: "留存：谁第二天还来",
    minutes: 14,
    summary: "增长是否健康，看留存比看拉新更早。次日留存是分析岗普通话。",
    blocks: [
      {
        type: "p",
        text: "留存：某日新增（或某日活跃）的人，在 +1 / +7 日是否还有行为。关键是定义「初始队列」和「回流事件」。",
      },
      {
        type: "sql",
        code: "WITH first_open AS (\n  SELECT user_id, MIN(DATE(event_dt)) AS cohort_dt\n  FROM events\n  GROUP BY user_id\n),\nactive AS (\n  SELECT DISTINCT user_id, DATE(event_dt) AS dt FROM events\n)\nSELECT f.cohort_dt,\n       COUNT(*) AS new_users,\n       SUM(CASE WHEN a.dt = DATE(f.cohort_dt, '+1 day') THEN 1 ELSE 0 END) AS d1\nFROM first_open f\nLEFT JOIN active a ON f.user_id = a.user_id\nGROUP BY 1;",
      },
      {
        type: "ul",
        items: [
          "新增留存 vs 活跃留存：队列不同，数字不同，不要混着汇报",
          "分渠道看留存：便宜量往往更差，这是投放日常",
          "N 日留存分母是队列人数，分子是 +N 日仍活跃的人数",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-10-q1",
        prompt: "次日留存 30%，含义最接近？",
        options: [
          "30% 的 DAU 是新用户",
          "某日队列里，有 30% 的人在第二天仍活跃",
          "每人第二天会来 0.3 次",
          "流失率是 30%",
        ],
        answer: 1,
        why: "留存是队列指标，分母是「那一天进来的人」，不是当天 DAU。",
      },
      {
        id: "sql-10-q2",
        prompt: "投放渠道次日留存显著低于自然量，优先怀疑？",
        options: [
          "SQL 不能算留存",
          "买来的用户意向弱或激励羊毛，量的质量差",
          "一定是埋点坏了",
          "应该立刻加预算",
        ],
        answer: 1,
        why: "量价之外要看质量。留存差的渠道会把长期 LTV 打穿。",
      },
    ],
    lab: {
      id: "sql-10-lab",
      title: "每个用户首次活跃日",
      prompt: "从 events 按 user_id 取 MIN(DATE(event_dt)) 作为首次活跃日，列出 user_id 与 cohort_dt。",
      hint: "GROUP BY user_id，MIN(DATE(event_dt))。",
      starter: "SELECT user_id, DATE(event_dt) AS dt\nFROM events\nLIMIT 10;",
      expectedSql:
        "SELECT user_id, MIN(DATE(event_dt)) AS cohort_dt FROM events GROUP BY user_id;",
    },
  },
  {
    id: "sql-11",
    track: "sql",
    order: 11,
    title: "口径与脏数据：数字打架时你站哪边",
    minutes: 10,
    summary: "分析师的信用来自口径。能解释差异，比能写出更炫的 SQL 更值钱。",
    blocks: [
      {
        type: "p",
        text: "财务 GMV、数仓 GMV、运营后台 GMV 对不上，是入职第一月的成人礼。你的工作不是选一个「赢」的数字，而是拆差异：时间窗、是否含退款、是否含未支付、是否含测试单、币种、时区。",
      },
      {
        type: "ul",
        items: [
          "测试账号：内部员工、白名单，应用 user_id 排除表",
          "状态机：created / paid / cancelled / refunded 同时存在",
          "重复上报：事件表去重键（user_id + event_dt + event_name 不够时要 event_id）",
          "金额单位：元 vs 分，错 100 倍时先看这个",
        ],
      },
      {
        type: "callout",
        title: "沟通模板",
        text: "「我这边是支付成功、未退款、业务时区、已剔测试。你那边如果含下单未支付，差额大致会在这个量级。」",
      },
    ],
    quiz: [
      {
        id: "sql-11-q1",
        prompt: "你的 GMV 比财务低 8%，优先做哪步？",
        options: [
          "把 SQL 改到一样就行，不问原因",
          "对齐时间窗、状态、退款、是否含税，列出差异清单再复算",
          "改用 Python",
          "认为财务一定错",
        ],
        answer: 1,
        why: "对账是清单题。先对齐定义，再怀疑实现。",
      },
      {
        id: "sql-11-q2",
        prompt: "events 里同一 event_id 出现两次，COUNT(*) 和 COUNT(DISTINCT event_id) ？",
        options: [
          "一定相同",
          "前者会被重复上报放大，去重应用事件 ID 或幂等键",
          "DISTINCT 更慢所以不用",
          "只会发生在 JOIN 之后",
        ],
        answer: 1,
        why: "日志重复是常态。先看主键是否真唯一。",
      },
    ],
    lab: {
      id: "sql-11-lab",
      title: "支付 vs 全状态订单",
      prompt: "分别统计 orders 全表行数，以及 status='paid' 的行数，体会口径差。",
      hint: "两个 COUNT，或一条查询里条件聚合。",
      starter: "SELECT COUNT(*) AS all_orders FROM orders;",
      expectedSql:
        "SELECT COUNT(*) AS all_orders, SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_orders FROM orders;",
    },
  },
  {
    id: "sql-12",
    track: "sql",
    order: 12,
    title: "综合取数：像面试那样讲清楚",
    minutes: 15,
    summary: "把前面的积木拼成一道完整题：分渠道的新客支付转化。",
    blocks: [
      {
        type: "p",
        text: "面试官常问：「给我各渠道新用户的支付转化。」你要口头拆步：1）新用户定义；2）转化分子分母；3）时间窗；4）是否去重。然后再写。",
      },
      {
        type: "sql",
        code: "WITH new_users AS (\n  SELECT user_id, channel, register_dt\n  FROM users\n  WHERE register_dt BETWEEN '2026-07-01' AND '2026-08-15'\n),\npaid AS (\n  SELECT DISTINCT user_id\n  FROM orders\n  WHERE status = 'paid'\n)\nSELECT n.channel,\n       COUNT(*) AS new_users,\n       COUNT(p.user_id) AS paid_users,\n       ROUND(1.0 * COUNT(p.user_id) / COUNT(*), 4) AS pay_rate\nFROM new_users n\nLEFT JOIN paid p ON n.user_id = p.user_id\nGROUP BY n.channel\nORDER BY pay_rate DESC;",
      },
      {
        type: "ul",
        items: [
          "LEFT JOIN 保留没有支付的新用户，转化率分母才完整",
          "ROUND / 1.0 * 避免整数除法变成 0",
          "答完补一句：还应该看留存和 CAC，转化高也可能是买了羊毛",
        ],
      },
      {
        type: "callout",
        title: "第一阶段收官",
        text: "入门到这里：会读表、过滤、聚合、JOIN、分群、时间、CTE、窗口、漏斗、留存、对口径。这还不够面大厂。下一阶段是面试里会当场让你写的 SQL。",
      },
    ],
    quiz: [
      {
        id: "sql-12-q1",
        prompt: "新客支付转化的分母应该是？",
        options: [
          "当天所有订单",
          "定义好的新用户队列人数",
          "DAU",
          "GMV",
        ],
        answer: 1,
        why: "转化率 = 达成行为的人数 / 队列人数。分母用错，比率无意义。",
      },
      {
        id: "sql-12-q2",
        prompt: "INNER JOIN 支付用户后再算转化，会发生？",
        options: [
          "更准确",
          "没支付的新用户被丢掉，转化率被抬成接近 100%",
          "语法错误",
          "只会变慢",
        ],
        answer: 1,
        why: "必须 LEFT JOIN 或先 COUNT 分母再 COUNT 分子。",
      },
    ],
    lab: {
      id: "sql-12-lab",
      title: "分渠道新用户数",
      prompt: "register_dt 在 2026-07-01 到 2026-08-15 的用户，按 channel 统计人数，从高到低。",
      hint: "WHERE 日期范围 + GROUP BY channel。",
      starter: "SELECT channel, COUNT(*) AS new_users\nFROM users\nGROUP BY channel;",
      expectedSql:
        "SELECT channel, COUNT(*) AS new_users FROM users WHERE register_dt BETWEEN '2026-07-01' AND '2026-08-15' GROUP BY channel ORDER BY new_users DESC;",
    },
  },
];

export const EXCEL_LESSONS: Lesson[] = [
  {
    id: "xl-01",
    track: "excel",
    order: 1,
    title: "透视表 ≈ GROUP BY",
    minutes: 8,
    summary: "Excel 透视表就是可视化的聚合。会 SQL 的人，透视表只是换皮。",
    blocks: [
      {
        type: "p",
        text: "行标签放 city，值放 SUM(pay_amount)，就是 GROUP BY city + SUM。列标签放 status，相当于多一个分组维。筛选器等于 WHERE。",
      },
      {
        type: "ul",
        items: [
          "值字段汇总方式：求和 / 计数 / 去重计数（Excel 365 才舒服）",
          "显示占比：透视表值字段「父行汇总的百分比」，对应 SQL 窗口 SUM() OVER()",
          "大厂很多周报仍从透视起步，再迁到看板",
        ],
      },
    ],
    quiz: [
      {
        id: "xl-01-q1",
        prompt: "透视表把渠道放行、把 GMV 放值（求和），对应 SQL？",
        options: [
          "SELECT * FROM orders",
          "SELECT channel, SUM(pay_amount) FROM orders GROUP BY channel",
          "JOIN 两张表",
          "窗口函数 LAG",
        ],
        answer: 1,
        why: "透视 = 分组聚合。先建立这层映射，Excel 和 SQL 就通了。",
      },
    ],
  },
  {
    id: "xl-02",
    track: "excel",
    order: 2,
    title: "VLOOKUP / XLOOKUP ≈ LEFT JOIN",
    minutes: 8,
    summary: "把用户渠道补到订单明细上，就是在 Excel 里做 JOIN。",
    blocks: [
      {
        type: "p",
        text: "订单表只有 user_id，渠道在用户表。XLOOKUP(user_id, 用户表id列, 渠道列) 等于 LEFT JOIN users。找不到就空着，别用假的 0 填上。",
      },
      {
        type: "ul",
        items: [
          "查找列必须有稳定键，一对多时 VLOOKUP 只返回第一个，和 SQL 放大行不同",
          "数据透视前先把维表字段 lookup 进来，避免「不会 JOIN 就手工复制」",
        ],
      },
    ],
    quiz: [
      {
        id: "xl-02-q1",
        prompt: "订单 10 万行、用户 8 万，按 user_id lookup 渠道，更像？",
        options: ["INNER JOIN（丢无主订单）", "LEFT JOIN（订单都在，没匹配则空）", "UNION", "GROUP BY"],
        answer: 1,
        why: "lookup 默认保留左表每一行，匹配不上就是空。",
      },
    ],
  },
  {
    id: "xl-03",
    track: "excel",
    order: 3,
    title: "清洗：去空、去重、分列",
    minutes: 8,
    summary: "脏数据和 SQL 课是同一件事。Excel 里用筛选、删除重复项、分列。",
    blocks: [
      {
        type: "p",
        text: "删除重复项 ≈ SELECT DISTINCT 或按主键保留一行。分列（按逗号）有时对应 SPLIT。筛选空值 ≈ WHERE col IS NULL。不要在没备份的文件上直接删。",
      },
    ],
    quiz: [
      {
        id: "xl-03-q1",
        prompt: "同一 order_id 出现两行再 SUM 金额，风险是？",
        options: ["没风险", "GMV 被加两次，应先按主键去重或确认是否多 SKU 明细", "Excel 会自动去重", "只影响颜色"],
        answer: 1,
        why: "和 SQL JOIN 放大是同一类事故。先问粒度。",
      },
    ],
  },
  {
    id: "xl-04",
    track: "excel",
    order: 4,
    title: "筛选、排序：先看清楚再汇总",
    minutes: 10,
    summary: "筛选 ≈ WHERE，排序 ≈ ORDER BY。没看过明细就做透视，脏会藏进合计里。",
    blocks: [
      {
        type: "p",
        text: "打开一张订单表，先筛出城市、状态、日期，看几十行像不像你以为的那样。再按金额从大到小排，看最大的几笔是不是测试。SQL 课里的 LIMIT 抽样，在这里就是筛选 + 排序。",
      },
      {
        type: "ul",
        items: [
          "筛选器空值要单独看，空不等于「不是杭州」",
          "多条件筛选就是 AND",
          "不要在没备份的文件上直接删行",
        ],
      },
    ],
    quiz: [
      {
        id: "xl-04-q1",
        prompt: "透视之前先筛选看明细，是为了？",
        options: ["浪费时间", "先发现测试单、空值、错日期，避免合计被脏数据带着走", "让文件变大", "代替 SQL"],
        answer: 1,
        why: "和 SQL 先 LIMIT 是同一习惯。",
      },
      {
        id: "xl-04-q2",
        prompt: "筛「不等于取消」却少了一批，更像？",
        options: ["Excel 坏了", "状态为空的行没进来", "一定被删了", "透视设置"],
        answer: 1,
        why: "空值比较会消失。和 SQL 一样。",
      },
      {
        id: "xl-04-q3",
        prompt: "Excel 筛选对应 SQL 的？",
        options: ["JOIN", "WHERE", "WINDOW", "UNION"],
        answer: 1,
        why: "筛行。",
      },
    ],
  },
  {
    id: "xl-05",
    track: "excel",
    order: 5,
    title: "按条件加总：SUMIF / COUNTIF",
    minutes: 10,
    summary: "只要某一城、某一状态的金额或行数，不必每次开透视。对应 SQL 的 SUM(CASE WHEN …)。",
    blocks: [
      {
        type: "p",
        text: "COUNTIF(状态列, \"paid\") 是在数满足条件的行。SUMIF(城市列, \"杭州\", 金额列) 是只把杭州的钱加上。条件一多，还是透视或 SQL 更稳，但周报里临时看一眼，这两个够用。",
      },
      {
        type: "ul",
        items: [
          "条件要完全一致：多一个空格就匹配不上",
          "不要对已经是明细放大后的金额再 SUMIF，先问一行是什么",
          "和 SQL 一样：数人、数次、加钱，三个问题不要用同一个公式混着答",
        ],
      },
    ],
    quiz: [
      {
        id: "xl-05-q1",
        prompt: "只要杭州的成交额，SUMIF 更像 SQL 的？",
        options: ["SELECT *", "SUM(金额) WHERE 城市=杭州", "DELETE", "UNION"],
        answer: 1,
        why: "条件加总。",
      },
      {
        id: "xl-05-q2",
        prompt: "COUNTIF 数的是？",
        options: ["人数一定对", "满足条件的行，一人多行会被数多次", "金额", "列数"],
        answer: 1,
        why: "要人数得先去重，或用透视对用户 ID 计数。",
      },
      {
        id: "xl-05-q3",
        prompt: "条件一多还用一串 SUMIF，风险是？",
        options: ["没有", "又慢又容易漏条件，该改透视或 SQL", "一定更准", "Excel 会自动优化成窗口函数"],
        answer: 1,
        why: "临时用，复杂了就换工具。",
      },
    ],
  },
  {
    id: "xl-06",
    track: "excel",
    order: 6,
    title: "透视表再往细里用",
    minutes: 12,
    summary: "行、列、值、筛选四块都放对，一张表能回答「谁、在哪、多少钱」。别把明细字段直接当值求和。",
    blocks: [
      {
        type: "p",
        text: "行放城市，列放渠道，值放金额求和，筛选放支付成功——这就是 GROUP BY 城市、渠道，WHERE 状态。值如果误放了订单号还选了求和，会加出没有意义的编号合计。订单号该计数，金额该求和，用户 ID 该去重计数（或先透视人数）。",
      },
      {
        type: "ul",
        items: [
          "值字段：钱用求和，单用计数，人用去重（或先处理再透视）",
          "显示占比前，先看绝对数对不对",
          "刷新数据源：表扩了行，透视还指着旧区域，会少算",
        ],
      },
    ],
    quiz: [
      {
        id: "xl-06-q1",
        prompt: "透视值里对订单号求和，问题是？",
        options: ["很好", "编号加总没有业务含义，订单该计数", "会自动变人数", "和金额一样"],
        answer: 1,
        why: "字段类型要配汇总方式。",
      },
      {
        id: "xl-06-q2",
        prompt: "只要支付成功，条件放哪？",
        options: ["值字段", "筛选器或先筛明细再透视", "行标签当装饰", "不能筛"],
        answer: 1,
        why: "对应 WHERE。",
      },
      {
        id: "xl-06-q3",
        prompt: "表多了新行，透视没变，先查？",
        options: ["电脑", "数据源区域有没有包含新行", "字体", "文件名"],
        answer: 1,
        why: "旧区域会少算。",
      },
    ],
  },
  {
    id: "xl-07",
    track: "excel",
    order: 7,
    title: "图不要骗人：从 0 开始、别切坐标",
    minutes: 8,
    summary: "周报里的柱状图，坐标轴不从 0 开始，小小的差会看起来像崩盘。",
    blocks: [
      {
        type: "p",
        text: "分析交图，优先让差异诚实。纵轴从 0 起；双轴只有在单位完全不同时才用，并写清。标题写成「8 月支付成功订单数」，不要写「情况很好」。",
      },
    ],
    quiz: [
      {
        id: "xl-07-q1",
        prompt: "柱状图纵轴从 90 到 100，2 个点的差看起来像腰斩，原因是？",
        options: ["数据错了", "坐标没从 0 起，把小差放大了", "颜色问题", "必须如此"],
        answer: 1,
        why: "图会说谎。从 0 起更老实。",
      },
      {
        id: "xl-07-q2",
        prompt: "图的标题较好的是？",
        options: ["大盘喜人", "8 月支付成功订单数（单位：笔）", "如图", "机密"],
        answer: 1,
        why: "标题是口径。",
      },
      {
        id: "xl-07-q3",
        prompt: "人和金额放双轴，风险是？",
        options: ["没有", "单位不同看起来在一起动，其实不可比，必须写清", "Excel 禁止", "一定更准"],
        answer: 1,
        why: "双轴容易造成假相关。",
      },
    ],
  },
  {
    id: "xl-08",
    track: "excel",
    order: 8,
    title: "交出去的表：让别人能接着用",
    minutes: 10,
    summary: "交接不是把文件丢过去。第一行是表头，不要合并乱单元格，日期是日期不是文本。",
    blocks: [
      {
        type: "p",
        text: "别人要把你的表再透视或再 lookup。合并单元格、表头在第三行、日期存成「8月1日」文本，都会让下一步崩溃。一列一个意思；空着就是空，不要填「无」除非对方要；在旁边一张纸写时间窗和是否含退款。",
      },
    ],
    quiz: [
      {
        id: "xl-08-q1",
        prompt: "最妨碍别人接着透视的是？",
        options: ["清晰表头", "合并单元格 + 表头不在第一行", "注明口径", "日期是日期格式"],
        answer: 1,
        why: "机器读不了合并的人情表。",
      },
      {
        id: "xl-08-q2",
        prompt: "空值怎么处理较稳？",
        options: ["一律填 0", "空就是空，除非口径规定空当 0", "填「无」好看", "填昨天的数"],
        answer: 1,
        why: "0 和空是两种意思。",
      },
      {
        id: "xl-08-q3",
        prompt: "交 Excel 时口径写哪？",
        options: ["只存在你脑子里", "表旁或单独一页：时间、状态、含不含退款", "文件名用哈哈哈", "微信口头一说就行"],
        answer: 1,
        why: "口径跟着文件走。",
      },
    ],
  },
];
