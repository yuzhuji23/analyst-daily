import type { Lesson } from "../types";

export const SQL_FOUNDATION: Lesson[] = [
  {
    id: "sql-f01",
    track: "sql",
    order: 13,
    title: "从一句话需求到取数提纲",
    minutes: 14,
    summary: "业务丢来一句「看一下上周转化」，你要能拆成：谁、什么行为、什么时间、什么口径。写 SQL 之前先写提纲。",
    blocks: [
      {
        type: "p",
        text: "分析岗一半事故发生在开口之前。对方说「转化有点差」，你如果立刻写 COUNT，多半会数错。先把那句话翻译成四格：人从哪来、做了什么算成功、从哪天到哪天、要不要去掉测试和退款。",
      },
      {
        type: "h",
        text: "提纲模板（写在 SQL 上面）",
      },
      {
        type: "ul",
        items: [
          "队列：哪些人进分母？例如上周新注册、或打开过 App 的人",
          "成功：哪些人进分子？例如支付成功，还是加购就行",
          "时间：用注册日、打开日，还是支付日？含不含今天",
          "脏：测试号、取消单、未支付要不要踢",
        ],
      },
      {
        type: "p",
        text: "四格写完，发给对方看一眼。他改一个字，你少返工两小时。实验室里也先在注释里写这四格，再写 SELECT。",
      },
      {
        type: "sql",
        code: "-- 队列：8/1–8/7 注册的用户\n-- 成功：期间内至少一笔 status=paid\n-- 时间：支付日落在注册后 7 天内（本课先做「曾经支付」）\n-- 脏：只要 paid\nSELECT COUNT(DISTINCT u.user_id) AS cohort\nFROM users u;",
      },
      {
        type: "callout",
        title: "养成",
        text: "不会写长 SQL 没关系。提纲四格写得出，就已经比很多「直接开写」的人稳。",
      },
    ],
    quiz: [
      {
        id: "sql-f01-q1",
        prompt: "「看一下转化」你首先该做？",
        options: ["立刻 COUNT(*)", "问清分母是谁、分子算什么成功、时间、要不要踢脏数据", "先画图", "先学窗口函数"],
        answer: 1,
        why: "需求不是数，是口径。提纲先于 SELECT。",
      },
      {
        id: "sql-f01-q2",
        prompt: "提纲里的「队列」指什么？",
        options: ["SQL 队列", "进分母的那批人", "服务器排队", "老板的日程"],
        answer: 1,
        why: "转化率的分母必须是一批评上的人，不能是全表行数。",
      },
      {
        id: "sql-f01-q3",
        prompt: "四格对完再写 SQL，最大好处是？",
        options: ["看起来忙", "对方改口径时你知道改哪一格，少返工", "一定更快出数", "可以不测"],
        answer: 1,
        why: "口径一变，只改对应那一格，不要整段重写。",
      },
    ],
  },
  {
    id: "sql-f02",
    track: "sql",
    order: 14,
    title: "人数、次数、金额，三个不能混",
    minutes: 14,
    summary: "同一张订单表，能问出三种完全不同的问题。混了，面试和工作里都会把人听晕。",
    blocks: [
      {
        type: "p",
        text: "把订单表想成小票堆。问「来了多少客人」是数人；问「开了多少张票」是数次；问「收了多少钱」是加金额。一个人可以开五张票，五张票金额还不一样。",
      },
      {
        type: "sql",
        code: "SELECT\n  COUNT(DISTINCT user_id) AS 人数,\n  COUNT(*) AS 次数,\n  SUM(pay_amount) AS 金额\nFROM orders\nWHERE status = 'paid';",
      },
      {
        type: "ul",
        items: [
          "人数：COUNT(DISTINCT 人的编号)",
          "次数：COUNT(*) 或 COUNT(订单编号)",
          "金额：SUM(钱的字段)，不要在一对多拼表之后再 SUM 整单金额",
        ],
      },
      {
        type: "p",
        text: "开口时把单位说出来：「昨天支付用户 120 人，订单 180 笔，金额 9600。」听的人就能跟上。只报一个 180，没人知道是人还是单。",
      },
    ],
    quiz: [
      {
        id: "sql-f02-q1",
        prompt: "老板要「多少人买过」，订单一人多单，该？",
        options: ["COUNT(*)", "COUNT(DISTINCT user_id)", "SUM(user_id)", "AVG(pay_amount)"],
        answer: 1,
        why: "问的是人，不是单。",
      },
      {
        id: "sql-f02-q2",
        prompt: "三个数里，哪一个最容易在 JOIN 明细后炸？",
        options: ["人数如果加了 DISTINCT 还好", "金额，整单被复制到每一行再加", "都不会", "只有次数"],
        answer: 1,
        why: "一对多会复制金额。人数用 DISTINCT 还能救，金额会先错。",
      },
      {
        id: "sql-f02-q3",
        prompt: "汇报时怎样最不容易被听错？",
        options: ["只报一个总数", "把人、次、钱三个单位都说出来", "只报比率", "只报同比"],
        answer: 1,
        why: "单位是人话。没有单位的数，像没写清的作业。",
      },
    ],
    lab: {
      id: "sql-f02-lab",
      title: "支付的人、次、钱",
      prompt: "status='paid'，一次查出去重人数 users、订单数 orders、金额 gmv。",
      hint: "COUNT(DISTINCT user_id)、COUNT(*)、SUM(pay_amount)。",
      starter: "SELECT COUNT(*) AS orders\nFROM orders\nWHERE status = 'paid';",
      expectedSql:
        "SELECT COUNT(DISTINCT user_id) AS users, COUNT(*) AS orders, SUM(pay_amount) AS gmv FROM orders WHERE status = 'paid';",
    },
  },
  {
    id: "sql-f03",
    track: "sql",
    order: 15,
    title: "AND、OR 和括号：条件会咬人",
    minutes: 12,
    summary: "两个条件用 AND 是两边都要满足；OR 是满足一个就进。括号决定谁先算。写错会 silently 多一堆人。",
    blocks: [
      {
        type: "p",
        text: "人话：AND 像同时戴两顶帽子，OR 像两顶里戴一顶就行。再加一层括号，像先算括号里的班，再跟外班合。",
      },
      {
        type: "sql",
        code: "-- 杭州的达人，或上海的字节广告\nSELECT user_id, city, channel\nFROM users\nWHERE (city = '杭州' AND channel = '达人')\n   OR (city = '上海' AND channel = '字节广告');",
      },
      {
        type: "p",
        text: "如果去掉括号写成 city = '杭州' AND channel = '达人' OR city = '上海'，计算机可能先算 AND 再 OR，上海所有渠道都会进来。LIMIT 抽几行看看，比看语法更早发现。",
      },
    ],
    quiz: [
      {
        id: "sql-f03-q1",
        prompt: "要「杭州且达人」，该用？",
        options: ["OR", "AND", "UNION 自己跟自己", "HAVING"],
        answer: 1,
        why: "两个条件同时成立用 AND。",
      },
      {
        id: "sql-f03-q2",
        prompt: "复杂 OR 时为什么要括号？",
        options: ["好看", "先算哪一捆，避免整城所有渠道被意外放进来", "SQL 强制", "加快速度"],
        answer: 1,
        why: "运算顺序会 silently 改结果。",
      },
      {
        id: "sql-f03-q3",
        prompt: "写完复杂 WHERE，最便宜的检查是？",
        options: ["交给老板", "LIMIT 抽几行看城市和渠道是不是你想要的那些", "加窗口函数", "删条件"],
        answer: 1,
        why: "抽样看长什么样，比直接 SUM 安全。",
      },
    ],
  },
  {
    id: "sql-f04",
    track: "sql",
    order: 16,
    title: "排序和只看前几行",
    minutes: 10,
    summary: "ORDER BY 决定谁在前，LIMIT 决定看几行。分析里用来抽异常、抽样，不是用来当分页网站。",
    blocks: [
      {
        type: "p",
        text: "先把满足条件的行找出来，再按某个字段排队，再只取前面几名。例如：支付金额最高的 20 笔，用来看是不是测试大额、还是真土豪。",
      },
      {
        type: "sql",
        code: "SELECT order_id, user_id, pay_amount, order_dt\nFROM orders\nWHERE status = 'paid'\nORDER BY pay_amount DESC\nLIMIT 20;",
      },
      {
        type: "ul",
        items: [
          "DESC 从大到小，ASC 从小到大（默认）",
          "两个字段：ORDER BY city, pay_amount DESC —— 先城市再金额",
          "没 ORDER BY 的 LIMIT，谁先出现不稳定，不要当「前 10 名」",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-f04-q1",
        prompt: "「金额最高的 10 单」缺哪一句会错？",
        options: ["SELECT", "ORDER BY pay_amount DESC 再 LIMIT 10", "JOIN users", "GROUP BY"],
        answer: 1,
        why: "不排序的 LIMIT 不是前十名。",
      },
      {
        id: "sql-f04-q2",
        prompt: "抽异常大额，最合适的是？",
        options: ["随机 LIMIT", "ORDER BY 金额从大到小 LIMIT 一小撮，用眼睛看", "AVG 一下", "删掉金额列"],
        answer: 1,
        why: "异常藏在两端。先看最大的那一撮。",
      },
      {
        id: "sql-f04-q3",
        prompt: "ORDER BY 两个字段时，谁优先？",
        options: ["写在后面的", "写在前面的先排，相同再按后面的排", "随机", "只认金额"],
        answer: 1,
        why: "从左到右。先城市再金额，就是每个城市里再比钱。",
      },
    ],
  },
  {
    id: "sql-f05",
    track: "sql",
    order: 17,
    title: "子查询：先做一张小表，再拿去用",
    minutes: 14,
    summary: "WITH 和括号里的 SELECT，都是「先算出一张临时结果，再当表用」。这样读 SQL 像读段落。",
    blocks: [
      {
        type: "p",
        text: "人话：先在草稿纸上列出「上周新用户」，再拿这张纸去对订单。草稿纸就是子查询。写在 WITH 里，还有名字，别人更好读。",
      },
      {
        type: "sql",
        code: "WITH new_users AS (\n  SELECT user_id, city\n  FROM users\n  WHERE register_dt >= '2026-08-01'\n)\nSELECT n.city, COUNT(*) AS new_cnt\nFROM new_users n\nGROUP BY n.city;",
      },
      {
        type: "p",
        text: "嵌套不要超过两三层。每层只做一件事：过滤、或聚合、或拼接。一层做十件事，出了错你找不到。",
      },
    ],
    quiz: [
      {
        id: "sql-f05-q1",
        prompt: "WITH new_users AS (...) 在干什么？",
        options: ["删除用户", "先做出一张有名字的小结果表，后面当表用", "创建真表永久保存", "备份数据库"],
        answer: 1,
        why: "临时、有名字、只在这条 SQL 里活着。",
      },
      {
        id: "sql-f05-q2",
        prompt: "为什么分析 SQL 爱用 WITH 拆段？",
        options: ["显得高级", "每段只做一件事，改口径时只动那一段", "一定更快", "必须如此才能 GROUP BY"],
        answer: 1,
        why: "可读、可改，比炫技重要。",
      },
      {
        id: "sql-f05-q3",
        prompt: "一层子查询里又过滤又 JOIN 又窗口，风险是？",
        options: ["没有", "出错时找不到是哪一步脏了", "语法不允许", "只能在 Excel 做"],
        answer: 1,
        why: "拆开才能定位。",
      },
    ],
  },
  {
    id: "sql-f06",
    track: "sql",
    order: 18,
    title: "日期：日、周、活动窗",
    minutes: 14,
    summary: "分析几乎天天切时间。要会把时间戳收到「天」，会写活动从哪天到哪天，会避开少算一天。",
    blocks: [
      {
        type: "p",
        text: "库里常常是「2026-08-10 19:32:00」这种带钟点的。按天看，要用 DATE(order_dt) 收到年月日。活动 10 号到 12 号，含 12 号整天的话，写成日期落在 10 和 12 之间，或 ≥10 号 0 点且 <13 号 0 点。",
      },
      {
        type: "sql",
        code: "SELECT DATE(order_dt) AS dt, COUNT(*) AS paid_orders\nFROM orders\nWHERE status = 'paid'\n  AND DATE(order_dt) BETWEEN '2026-08-10' AND '2026-08-12'\nGROUP BY 1\nORDER BY 1;",
      },
      {
        type: "ul",
        items: [
          "含尾日：BETWEEN 两端都含；或用 < 下一天零点，避免少最后一天",
          "环比：这周和上周同一口径比，不要这周 7 天跟上周 5 天比",
          "注册日、下单日、支付日不是同一个钟，开口要说你用的是哪一个",
        ],
      },
    ],
    quiz: [
      {
        id: "sql-f06-q1",
        prompt: "活动 10–12 号，写成 order_dt >= '08-10' AND order_dt < '08-12'，会？",
        options: ["正好三天", "把 12 号整天漏掉，只覆盖到 12 号 0 点之前", "多算一天", "语法错"],
        answer: 1,
        why: "小于 12 号 0 点，进不去 12 号。尾日要含就 <13 号或 BETWEEN 到 12 号。",
      },
      {
        id: "sql-f06-q2",
        prompt: "按天看订单，DATE(order_dt) 是在？",
        options: ["改数据库", "把带钟点的时间收到「哪一天」", "时区转换到纽约", "删除时间"],
        answer: 1,
        why: "日报用天，不用每一秒。",
      },
      {
        id: "sql-f06-q3",
        prompt: "对比两周，最该对齐的是？",
        options: ["字体", "都是完整 7 天、同一口径", "随便 5 天也行", "只比周末"],
        answer: 1,
        why: "天数和口径不对齐，涨跌是假的。",
      },
    ],
  },
  {
    id: "sql-f07",
    track: "sql",
    order: 19,
    title: "结果表怎么交给别人",
    minutes: 12,
    summary: "SQL 跑通不是终点。交给运营的表，要让人 10 秒看懂：每一列是什么单位、按什么排。",
    blocks: [
      {
        type: "p",
        text: "列名写成 city、paid_users、gmv，比 a、b、c 友好。金额保留合理小数。按对方关心的顺序排：他要看谁最差，就按转化从低到高。第一行写人口径，比写在聊天里可靠。",
      },
      {
        type: "ul",
        items: [
          "一列一个意思，不要把人和单塞进同一格",
          "比率写成 0.31 或 31%，开口说明是哪一种",
          "极端值另附：最大的几单、空值多少行",
          "注明时间窗和是否含退款，写在文件名或表头注释",
        ],
      },
      {
        type: "callout",
        title: "交接",
        text: "对方拿着表能复述「这是上周支付成功、按城市的人数和金额」，你才算交完。",
      },
    ],
    quiz: [
      {
        id: "sql-f07-q1",
        prompt: "给业务的结果表，最不该出现的是？",
        options: ["带单位的列名", "没说明的 a、b、c 列", "时间窗", "排序"],
        answer: 1,
        why: "看不懂的列等于没交。",
      },
      {
        id: "sql-f07-q2",
        prompt: "比率 0.31，交接时要说清？",
        options: ["不用", "这是 31% 还是 0.31%，分母是谁", "只说好看", "改成分数"],
        answer: 1,
        why: "同一张表，0.31 和 31 会被读成两种世界。",
      },
      {
        id: "sql-f07-q3",
        prompt: "交表前要写在旁边的是？",
        options: ["心情", "时间、状态、含不含退款", "你的简历", "竞品名字"],
        answer: 1,
        why: "口径跟着表走，才不会下周对不上。",
      },
    ],
  },
  {
    id: "sql-f08",
    track: "sql",
    order: 20,
    title: "对不上时的检查清单",
    minutes: 12,
    summary: "你的数和看板差一截，先不要改代码去贴。按清单一项项对。",
    blocks: [
      {
        type: "p",
        text: "清单可以贴在显示器边：时间起止是否含头含尾；状态是支付成功还是含下单；有没有测号；是人数还是次数；JOIN 有没有把行放大；空值有没有被 WHERE 吃掉。",
      },
      {
        type: "ul",
        items: [
          "时间：有没有少最后一天",
          "状态：paid / created / cancelled",
          "人还是单：DISTINCT 有没有漏",
          "拼表：明细有没有把金额加爆",
          "空值：城市为空算不算「非杭州」",
          "时区、分区：昨天的数据是否已经进来",
        ],
      },
      {
        type: "p",
        text: "对完仍差，把两边的口径写成两行发给对方。差在哪一项清楚了，才谈谁改。",
      },
    ],
    quiz: [
      {
        id: "sql-f08-q1",
        prompt: "和对不上看板，你先做？",
        options: ["把数改成一样", "按时间、状态、人单、JOIN、空值一项项对", "删看板", "重装电脑"],
        answer: 1,
        why: "贴数会把真问题盖住。",
      },
      {
        id: "sql-f08-q2",
        prompt: "清单里哪条专门防 JOIN 事故？",
        options: ["时区", "明细有没有把金额加爆", "字体", "列宽"],
        answer: 1,
        why: "一对多复制金额，是对不上的常客。",
      },
      {
        id: "sql-f08-q3",
        prompt: "对完仍差，下一步？",
        options: ["争谁蠢", "把两边口径写成两行对着看", "平均两个数交差", "不了了之"],
        answer: 1,
        why: "翻译差项，不站队。",
      },
    ],
  },
  {
    id: "sql-f09",
    track: "sql",
    order: 21,
    title: "练习：把问题写成三行再动手",
    minutes: 14,
    summary: "给三道像工作里会碰到的短题。先写提纲，再想 SQL 骨架，不要求一次写完美。",
    blocks: [
      {
        type: "p",
        text: "题一：杭州上周支付了多少人、多少单、多少钱。提纲：队列是杭州用户还是杭州订单？成功是 paid？时间是下单日还是支付日？本题按订单表 city + paid + 日期。",
      },
      {
        type: "p",
        text: "题二：哪个渠道注册的人最多。提纲：数的是 users 表的人，GROUP BY channel，ORDER BY 人数 DESC。不要去订单表 COUNT 行。",
      },
      {
        type: "p",
        text: "题三：注册了但还没有支付成功的人有多少。提纲：users LEFT JOIN 支付成功的人，右表为空。INNER JOIN 会把没买过的丢掉。",
      },
      {
        type: "sql",
        code: "SELECT u.user_id\nFROM users u\nLEFT JOIN orders o\n  ON u.user_id = o.user_id AND o.status = 'paid'\nWHERE o.order_id IS NULL;",
      },
      {
        type: "callout",
        title: "这一课怎么用",
        text: "每道题先口头四格，再打开实验室试。试完对照提纲，看自己漏的是人单还是 JOIN。",
      },
    ],
    quiz: [
      {
        id: "sql-f09-q1",
        prompt: "「哪个渠道人最多」应该数哪张表？",
        options: ["orders 行数", "users 按 channel 数人", "events 行数", "随便"],
        answer: 1,
        why: "问的是注册来路的人，在用户表。",
      },
      {
        id: "sql-f09-q2",
        prompt: "注册了没支付，为什么不能 INNER JOIN 支付单？",
        options: ["会变慢", "没支付的人会被丢掉，数出来是 0 或只剩买过的", "语法错", "城市会丢"],
        answer: 1,
        why: "要留住左表所有用户。",
      },
      {
        id: "sql-f09-q3",
        prompt: "三道短题共同的通用前置是？",
        options: ["先写窗口函数", "先写清数人还是数单、时间、怎么拼表", "先画看板", "先问要不要 Python"],
        answer: 1,
        why: "提纲通了，SQL 只是翻译。",
      },
    ],
    lab: {
      id: "sql-f09-lab",
      title: "各渠道注册人数",
      prompt: "users 按 channel 统计人数，从多到少。",
      hint: "GROUP BY channel ORDER BY COUNT(*) DESC。",
      starter: "SELECT channel, COUNT(*) AS users\nFROM users\nGROUP BY channel;",
      expectedSql:
        "SELECT channel, COUNT(*) AS users FROM users GROUP BY channel ORDER BY users DESC;",
    },
  },
  {
    id: "sql-f10",
    track: "sql",
    order: 22,
    title: "口径要有主人：别发明第二个「成交」",
    minutes: 12,
    summary: "公司里同一个词，可能有三套算法。分析岗要问「这数归谁定义」，不要自己发明第四套。",
    blocks: [
      {
        type: "p",
        text: "成交、活跃、新客，听着都熟。财务的成交可能不含退款，运营的成交可能含未支付，投放的成交可能只含带广告点击的。你各写一套，周会就会变成三个人三种数。",
      },
      {
        type: "ul",
        items: [
          "先问：这个指标有没有文档或看板口径",
          "有：按它写，差异当「对照」另开一列，不要覆盖",
          "没有：你写的四格提纲发出来当临时口径，请对方点头",
          "改口径是大事，要留版本：8 月用 A，9 月改 B，旧数不要偷偷重刷完还不说",
        ],
      },
      {
        type: "callout",
        title: "入门收到这里",
        text: "前面是语法和习惯，这一课是协作。数要对齐，先对齐主人。后面的面试 SQL 会更绕，但四格提纲和人单钱分清，一直要用。",
      },
    ],
    quiz: [
      {
        id: "sql-f10-q1",
        prompt: "已经有官方成交口径时，你该？",
        options: ["按自己理解重写一套当主结果", "按官方写，另开一列做你的对照", "忽略官方", "平均两套"],
        answer: 1,
        why: "主结果跟主人。你的理解可以对照，不能偷换。",
      },
      {
        id: "sql-f10-q2",
        prompt: "没有文档时怎么办？",
        options: ["随便写", "把四格提纲发出去请对方点头，当作临时口径", "等一年", "只用 Excel"],
        answer: 1,
        why: "临时口径也要被看见。",
      },
      {
        id: "sql-f10-q3",
        prompt: "改口径时最不该？",
        options: ["说明哪天改了什么", "偷偷重刷历史还不说", "留两列对比", "写进周报"],
        answer: 1,
        why: "历史被暗改，趋势就假了。",
      },
    ],
  },
];
