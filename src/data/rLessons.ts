import type { Lesson } from "../types";

export const R_LESSONS: Lesson[] = [
  {
    id: "r-01",
    track: "r",
    order: 1,
    title: "先选工具：什么问题不该打开 R",
    minutes: 12,
    summary: "分析岗不是「会的语言越多越好」。先判断这题该留在 SQL、该丢给 Python，还是才轮到 R。",
    blocks: [
      {
        type: "p",
        text: "国内互联网分析岗，日常 80% 的活是 SQL：口径、取数、大盘、分城市分渠道。Excel 接临时表。Python 接自动化和工程。R 不是第三门「也要会写循环」的语言，它是：表已经到手之后，判断「这点差别算不算真的」、做回归、出给会议看的统计图。",
      },
      {
        type: "h",
        text: "上班时先问这三句",
      },
      {
        type: "ul",
        items: [
          "数还在仓库里，要的是口径清楚的一张结果表 → 写 SQL。别导出一百万行再在 R 里 GROUP BY。",
          "表已经很小了，老板问「高了 0.3 个点算涨吗」、要控制城市后再看补贴 → 打开 R。",
          "要定时跑、接接口、把结论塞进线上、和工程同一套仓库 → Python。R 也能脚本化，但国内业务仓库几乎是 Python。",
        ],
      },
      {
        type: "callout",
        title: "别用学生思维",
        text: "课上会让你用三种语言做同一道题。工作上这叫浪费。同一张 GMV，SQL 能交，就不要再用 pandas 重写一遍证明你会 Python。",
      },
      {
        type: "p",
        text: "Excel 的位置：人少、要当天给业务自己拖着玩、透视比写 SQL 更快。它不是「低级」，是沟通成本最低的交付。你会 SQL 之后，透视表只是换皮。",
      },
      {
        type: "h",
        text: "和你已有的 Python 怎么分工",
      },
      {
        type: "ul",
        items: [
          "Python 强在：管道、API、爬数、特征进模型、和后端共用。分析师用它，常常是「这事要反复跑」或「工程只收 .py」。",
          "R 强在：统计默认值合理、检验和回归的输出是给人读的（系数、区间、p 值），ggplot 图层适合报告。实验、策略、调研、咨询更常见。",
          "语法很像，坑也像。下一课专门拆，避免你把 True 写成 TRUE 还觉得自己对。",
        ],
      },
    ],
    quiz: [
      {
        id: "r-01-q1",
        prompt: "老板要「昨日杭州支付成功 GMV」。你第一步应该？",
        options: [
          "打开 R 做 t 检验",
          "先确认口径，用 SQL 从订单表筛 paid、按支付金额加总",
          "用 Python 把全表读进内存再 sum",
          "先画一张 ggplot",
        ],
        answer: 1,
        why: "这是取数和口径。SQL 的活。R 和 Python 这时候都是多余的。",
      },
      {
        id: "r-01-q2",
        prompt: "实验组转化率高了 0.4 个百分点，运营说「看，涨了」。你该用什么？",
        options: [
          "SQL COUNT 再除一下就够了",
          "R 做比例检验 / t 检验，并看样本量和实际意义",
          "Excel 画饼图",
          "Python 上线一个模型",
        ],
        answer: 1,
        why: "差几个点是噪声还是效果，是统计判断。这是 R 在分析岗真正值钱的时刻。",
      },
      {
        id: "r-01-q3",
        prompt: "每天要把数仓一张汇总表发到飞书，失败要重试。更合适的是？",
        options: ["R Markdown", "SQL 窗口函数", "Python 定时任务", "手动手动复制"],
        answer: 2,
        why: "重复、接口、失败重试是工程。国内默认 Python。",
      },
    ],
  },
  {
    id: "r-02",
    track: "r",
    order: 2,
    title: "别和 Python 学混：赋值、下标、TRUE",
    minutes: 12,
    summary: "R 和 Python 像堂兄弟：能看懂对方，照着抄会翻车。分析师最常栽在下标和空值。",
    blocks: [
      {
        type: "p",
        text: "你有一点 Python，这是优势：循环、函数、表的概念都通。危险的是「看起来能跑」。工作里一次下标写错，第一笔订单就消失，周报数字会对不上 SQL。",
      },
      {
        type: "code",
        code: "# R                         # Python\nx <- 10                     # x = 10\nTRUE / FALSE                # True / False\nc(1, 2, 3)                  # [1, 2, 3]\npaid[1]                     # paid[0]   ← 最要命\norders$status               # orders[\"status\"]\nNA                          # None / nan  不是一回事",
      },
      {
        type: "ul",
        items: [
          "赋值：工作里 R 写 <-，看到 = 也行，但别和 Python 的 == 搞混。== 在两边都是比较。",
          "下标从 1 开始。paid[0] 在 R 里得到空向量，不会报错，数字会默默变少。",
          "逻辑值必须大写 TRUE / FALSE。true 会被当成变量名，还没定义就报错。",
          "c() 是向量：同一列类型要一样。Python list 可以混装，R 向量不行。混装请用 list()。",
          "取列用 $ 或 [[\"status\"]]。Python 的 orders.status 有时能用，R 里 orders.status 是「列名带点」很少见。",
        ],
      },
      {
        type: "callout",
        title: "空值对照（交数前必看）",
        text: "Python None = 没有这个对象。pandas nan = 浮点缺失。R 的 NULL = 没有这个东西；NA = 格子在，但未知。订单金额空着是 NA，不是 NULL。对 NA 做 mean() 会得到 NA，必须显式 na.rm = TRUE，或先问这批空值该不该进 GMV。",
      },
      {
        type: "p",
        text: "代码块：Python 靠缩进，R 靠 {}。一行写完用分号可以，但别养成习惯。管道以后会见到 |> 或 %>%，先把它想成 Python 的 . 链式调用：左边的结果送进右边。",
      },
    ],
    quiz: [
      {
        id: "r-02-q1",
        prompt: "支付成功金额向量叫 paid。要第一笔，R 怎么写？",
        options: ["paid[0]", "paid[1]", "paid.first()", "paid[-1]"],
        answer: 1,
        why: "R 从 1 开始。写 0 不会炸，会返回空的，比报错更危险。",
      },
      {
        id: "r-02-q2",
        prompt: "mean(c(10, NA, 20)) 默认得到什么？",
        options: ["15", "NA", "10", "报错"],
        answer: 1,
        why: "有 NA 参与，均值就是未知。业务上要先决定：这笔空金额算 0、剔除，还是回去修数。",
      },
      {
        id: "r-02-q3",
        prompt: "同事 Python 里写 orders['status'] == 'paid'。R 里最接近的是？",
        options: [
          "orders.status == paid",
          "orders$status == \"paid\"",
          "orders[status] = paid",
          "WHERE status paid",
        ],
        answer: 1,
        why: "$ 取列，字符串要加引号。paid 不加引号会被当成变量。",
      },
    ],
    lab: {
      id: "r-02-lab",
      lang: "r",
      title: "取出第一笔支付成功金额",
      prompt: "从 orders 里拿出 status 为 paid 的 pay_amount，做成向量，取第一笔。最后一行写出这个数字。",
      hint: "R 下标从 1 开始。条件筛选：向量[条件]。别写 [0]。",
      starter: "paid <- orders$pay_amount[orders$status == \"paid\"]\n# 取第一笔",
      expectedSql: "paid <- orders$pay_amount[orders$status == \"paid\"]\npaid[1]",
    },
  },
  {
    id: "r-03",
    track: "r",
    order: 3,
    title: "data.frame 就是表：先看再算",
    minutes: 12,
    summary: "分析师手里的 R，核心不是画正态曲线，是一张和 SQL 同一粒度的表。",
    blocks: [
      {
        type: "p",
        text: "data.frame ≈ pandas DataFrame ≈ SQL 的表。一行还是一笔订单，一列还是一个字段。实验室里的 users / orders / events，和 SQL 课是同一门生意，只是行数更少，方便你盯着看。",
      },
      {
        type: "code",
        code: "head(orders)          # 先看前几行，对应 SQL LIMIT\nstr(orders)           # 每列什么类型\nnames(orders)         # 有哪些字段\nnrow(orders)          # 多少行\norders$city           # 拿出一列 = 向量\norders[1, ]           # 第一行（还是从 1 开始）\norders[, c(\"city\",\"pay_amount\")]",
      },
      {
        type: "ul",
        items: [
          "接到导出表，先 head / str，不要直接 summary 或建模。脏城市名、测试单、金额空，一眼能看出来。",
          "orders[行, 列]。只写逗号一边：orders[1, ] 是行，orders[, 3] 是列。逗号丢了，含义就变。",
          "筛选行：orders[orders$city == \"杭州\", ] 末尾那个逗号别省，表示「列全要」。",
          "Python loc/iloc 是 0 起；R 这里全是 1 起。混着用的那天，抽查第一行对一下 SQL。",
        ],
      },
      {
        type: "callout",
        title: "面试加分句",
        text: "「我先确认一行是什么，再写筛选。」和 SQL 第一课同一句话。换语言不换原则。",
      },
    ],
    quiz: [
      {
        id: "r-03-q1",
        prompt: "orders[orders$city == \"杭州\"] 少了什么，最容易出问题？",
        options: [
          "没写 Python",
          "逗号：应该 orders[条件, ]，否则会按列名去匹配，结果不是你想的那张表",
          "没写 ggplot",
          "应该用 == True",
        ],
        answer: 1,
        why: "data.frame 用 [行, 列]。逗号是在告诉 R：这是筛行。",
      },
      {
        id: "r-03-q2",
        prompt: "str(orders) 的业务用途是？",
        options: [
          "让代码看起来专业",
          "看每列类型和样例，避免把金额当文字去加总",
          "代替核对口径",
          "自动画图",
        ],
        answer: 1,
        why: "pay_amount 若是字符，sum 会胡闹。先看类型是分析师的洗手动作。",
      },
    ],
    lab: {
      id: "r-03-lab",
      lang: "r",
      title: "找出杭州、达人渠道的用户",
      prompt: "从 users 取出 city 为杭州且 channel 为达人的用户，只要 user_id、city、channel、register_dt 四列。",
      hint: "两个条件用 &（不是 and）。最后记得逗号再选列：df[条件, c(\"col1\",\"col2\")]。",
      starter: "head(users)\n# 筛杭州 + 达人，只要四列",
      expectedSql:
        "users[users$city == \"杭州\" & users$channel == \"达人\", c(\"user_id\", \"city\", \"channel\", \"register_dt\")]",
    },
  },
  {
    id: "r-04",
    track: "r",
    order: 4,
    title: "切行、汇总：对上 SQL 才敢交",
    minutes: 12,
    summary: "R 的筛选和聚合，就是 WHERE 和 GROUP BY。数字必须能对上仓库。",
    blocks: [
      {
        type: "p",
        text: "业务要的永远是「支付成功的 GMV、按城市拆」。SQL 你已经会写。R 里同一句话，只是换皮。入职后如果 R 的数和看板对不上，先查是不是忘了筛 paid，而不是先怀疑 R。",
      },
      {
        type: "code",
        code: "# SQL: SELECT city, SUM(pay_amount) FROM orders WHERE status='paid' GROUP BY city\n\npaid <- orders[orders$status == \"paid\", ]\naggregate(pay_amount ~ city, data = paid, FUN = sum)\n\n# pandas 对照\n# paid = orders[orders[\"status\"]==\"paid\"]\n# paid.groupby(\"city\")[\"pay_amount\"].sum()",
      },
      {
        type: "ul",
        items: [
          "筛行 = WHERE。R 用逻辑向量：==、>、%in%、&（且）、|（或）。不要写 and / or。",
          "aggregate(数值 ~ 分组, data, FUN) = GROUP BY。~ 左边是要算的列，右边是切开的维度。",
          "mean / sum / length 对应 AVG / SUM / COUNT。客单价 = 金额合计 / 单数，不要对金额取 mean 就当客单价还混进未支付。",
          "公司里更常见 dplyr：filter / group_by / summarise。和 SQL 单词几乎一一对应。实验室先用自带的 aggregate，不装包也能跑。",
        ],
      },
      {
        type: "callout",
        title: "对账习惯",
        text: "R 算完，用同一口径在 SQL 实验室跑一遍。差 1 块钱都要停：是 NA、是退款、还是城市字段两边不一致。能对上，才是分析；对不上，是两套故事。",
      },
    ],
    quiz: [
      {
        id: "r-04-q1",
        prompt: "aggregate(pay_amount ~ city, data = paid, FUN = sum) 里，~ 的意思是？",
        options: [
          "管道",
          "按 city 切开，对 pay_amount 做 FUN",
          "只保留 city 列",
          "Python 的 lambda",
        ],
        answer: 1,
        why: "公式写法：左边指标，右边维度。就是 GROUP BY city。",
      },
      {
        id: "r-04-q2",
        prompt: "paid 里混着 cancelled，GMV 会怎样？",
        options: [
          "R 会自动剔除取消单",
          "取消单若仍有金额，会被加进去，口径就脏了",
          "一定会报错",
          "只影响 Python 不影响 R",
        ],
        answer: 1,
        why: "语言不会帮你做业务口径。status 是你的责任。",
      },
    ],
    lab: {
      id: "r-04-lab",
      lang: "r",
      title: "各城市支付成功 GMV",
      prompt: "只保留 status 为 paid 的订单，按 city 对 pay_amount 求和。最后一行写出这张汇总表。",
      hint: "先筛 paid 再 aggregate。NA 金额会被 aggregate 默认丢掉，这里可以先不管。",
      starter: "paid <- orders[orders$status == \"paid\", ]\n# 按城市加总金额",
      expectedSql: "paid <- orders[orders$status == \"paid\", ]\naggregate(pay_amount ~ city, data = paid, FUN = sum)",
    },
  },
  {
    id: "r-05",
    track: "r",
    order: 5,
    title: "接表：merge 就是 JOIN",
    minutes: 10,
    summary: "订单上没有性别，性别在用户表。接起来再拆，才是业务问题，不是语法问题。",
    blocks: [
      {
        type: "p",
        text: "看板要「男女付费 GMV」，订单表没有 gender。SQL 用 LEFT JOIN，Excel 用 XLOOKUP，pandas 用 merge，R 也叫 merge。工具不同，键（user_id）必须唯一且同粒度，否则一行变多行，GMV 会膨胀。",
      },
      {
        type: "code",
        code: "paid <- orders[orders$status == \"paid\", ]\nm <- merge(\n  paid,\n  users[, c(\"user_id\", \"gender\")],\n  by = \"user_id\",\n  all.x = TRUE   # LEFT JOIN：订单都留着\n)\naggregate(pay_amount ~ gender, data = m, FUN = sum)\n\n# pandas: paid.merge(users[[\"user_id\",\"gender\"]], on=\"user_id\", how=\"left\")",
      },
      {
        type: "ul",
        items: [
          "all.x = TRUE 保留左边每一行（订单）。匹配不上性别就是 NA，不要填成「未知用户」再假装有数。",
          "all = TRUE 是 FULL JOIN，分析日报很少用。",
          "默认 merge 是 INNER JOIN，会丢掉没有用户资料的订单。交数前数一下 nrow，和原订单比。",
          "一对多：一个 user_id 在维表出现两次，订单会被复制。JOIN 放大是事故，不是技巧。",
        ],
      },
    ],
    quiz: [
      {
        id: "r-05-q1",
        prompt: "merge 时忘了 all.x = TRUE，最可能发生什么？",
        options: [
          "变成 LEFT JOIN",
          "变成 INNER JOIN，没有用户资料的订单消失，GMV 变少",
          "自动补性别",
          "只影响画图",
        ],
        answer: 1,
        why: "默认内连接。人数对不上时，先看 JOIN 类型。",
      },
      {
        id: "r-05-q2",
        prompt: "维表里同一 user_id 两行不同城市，merge 后订单 GMV 变大。原因？",
        options: [
          "R 的 bug",
          "一对多复制了订单行，金额被加了两遍",
          "需要 t.test",
          "应该用 Python",
        ],
        answer: 1,
        why: "键不唯一就会放大。先对维表去重，再接。",
      },
    ],
    lab: {
      id: "r-05-lab",
      lang: "r",
      title: "支付成功 GMV 按性别",
      prompt: "paid 订单 LEFT JOIN 用户表的 gender，再按 gender 对 pay_amount 求和。最后一行写出汇总表。",
      hint: "merge(..., by = \"user_id\", all.x = TRUE)，再 aggregate。",
      starter: "paid <- orders[orders$status == \"paid\", ]\n# merge 用户性别，再按 gender 加总",
      expectedSql:
        "paid <- orders[orders$status == \"paid\", ]\nm <- merge(paid, users[, c(\"user_id\", \"gender\")], by = \"user_id\", all.x = TRUE)\naggregate(pay_amount ~ gender, data = m, FUN = sum)",
    },
  },
  {
    id: "r-06",
    track: "r",
    order: 6,
    title: "NA：脏数据，不是语法彩蛋",
    minutes: 10,
    summary: "实验室里有两笔支付成功金额是空的。你怎么处理，数字就会往哪边偏。",
    blocks: [
      {
        type: "p",
        text: "对账没回来、埋点丢字段、导入把空格写成空，都会变成 NA。mean(pay_amount) 直接给你 NA——这是 R 在喊：你还没决定这批空值算什么。Python 的 skipna 默认 True，更容易悄悄丢掉。两种默认值都危险，差别只是谁更吵。",
      },
      {
        type: "code",
        code: "sum(is.na(orders$pay_amount))          # 空了几笔\nmean(orders$pay_amount)                 # NA，因为有空\nmean(orders$pay_amount, na.rm = TRUE)   # 先问自己：丢掉对不对？\n\npaid <- orders[orders$status == \"paid\", ]\nmean(paid$pay_amount, na.rm = TRUE)     # 客单：只看支付成功且有金额的",
      },
      {
        type: "ul",
        items: [
          "is.na() 找空。is.null() 是另一回事：NULL 是「没有这个对象」。",
          "na.rm = TRUE = 计算时当这行不存在。GMV 会少一截。要在周报里写「已剔除 2 笔金额缺失」。",
          "填 0 更狠：空单变成 0 元成交，客单价被拉低。没业务许可别填。",
          "Python：df[\"pay_amount\"].mean() 默认跳过 NaN。你从 pandas 转 R，会觉得 R 很烦。烦是对的。",
        ],
      },
      {
        type: "callout",
        title: "和老板怎么说",
        text: "「19 笔支付成功里 2 笔金额空，客单价按 17 笔算。若把空的当 0，客单会更低。」给选择，不要给一个假装精确的小数。",
      },
    ],
    quiz: [
      {
        id: "r-06-q1",
        prompt: "支付成功里有 NA 金额，直接 mean(pay_amount) 不写 na.rm，结果是？",
        options: ["自动当 0", "NA", "去掉空值后的均值", "报错退出"],
        answer: 1,
        why: "R 拒绝在你没表态时假装知道均值。",
      },
      {
        id: "r-06-q2",
        prompt: "把 NA 金额填成 0 再算客单价，业务风险是？",
        options: [
          "没有风险",
          "空单被当成 0 元成交，客单被拉低，看起来像用户突然变穷",
          "只有 Python 会这样",
          "SQL 会自动修正",
        ],
        answer: 1,
        why: "缺失不是 0 成交。0 是一个很强的业务假设。",
      },
    ],
    lab: {
      id: "r-06-lab",
      lang: "r",
      title: "支付成功订单的客单价（处理 NA）",
      prompt: "计算 status 为 paid 的订单的平均 pay_amount。空金额先剔除（na.rm = TRUE）。最后一行写出这个均值。",
      hint: "mean(向量, na.rm = TRUE)。先筛 paid。",
      starter: "paid <- orders$pay_amount[orders$status == \"paid\"]\n# 客单价，空值先去掉",
      expectedSql: "paid <- orders$pay_amount[orders$status == \"paid\"]\nmean(paid, na.rm = TRUE)",
    },
  },
  {
    id: "r-07",
    track: "r",
    order: 7,
    title: "一张图要能推进会，不是装饰",
    minutes: 10,
    summary: "分析师的图是论据。3 秒看不出结论的图，不如贴表。",
    blocks: [
      {
        type: "p",
        text: "会议要的是「北京 GMV 明显高于杭州、上海」。柱状对比足够。趋势才用线。饼图几乎从不该出现在分析周报——人眼读不好角度。Python 的 matplotlib 是一串命令往画布上堆；R 的 ggplot 是图层：数据、坐标、几何形状分开写。实验室先用自带的 barplot，公司里你更常看到 ggplot2。",
      },
      {
        type: "code",
        code: "paid <- orders[orders$status == \"paid\", ]\ntab <- aggregate(pay_amount ~ city, data = paid, FUN = sum)\nbarplot(tab$pay_amount, names.arg = tab$city, ylab = \"GMV\", main = \"支付成功 GMV 按城市\")\n\n# 公司里更常见的 ggplot 写法（本实验室不强制安装）：\n# ggplot(tab, aes(city, pay_amount)) + geom_col() + labs(y = \"GMV\")",
      },
      {
        type: "ul",
        items: [
          "先有表，再画图。图是表的投影。核对仍然对表，不对像素。",
          "标题写结论或指标名，不要写「图表 1」。",
          "颜色别当主角。色弱同事和投影机都会辜负你的渐变。",
          "Python seaborn 和 ggplot 都很能出片。出片不是目标，改预算才是。",
        ],
      },
      {
        type: "callout",
        title: "交付标准",
        text: "图下面仍要有一张可复制的汇总表。运营会把表贴进自己的周报。你不给表，他们就截图，数字从此无法再算。",
      },
    ],
    quiz: [
      {
        id: "r-07-q1",
        prompt: "三个城市的 GMV 对比，优先用？",
        options: ["饼图", "柱状图", "3D 爆炸图", "词云"],
        answer: 1,
        why: "比长短，用柱。饼图比的是夹角，会议里读得慢还读不准。",
      },
      {
        id: "r-07-q2",
        prompt: "画完图发现和 SQL 看板差 8%，你该？",
        options: [
          "把图调好看一点",
          "停，先对表：筛选、NA、退款，图只是展示",
          "换 Python 再画一次",
          "把标题改成「约数」",
        ],
        answer: 1,
        why: "图不负责口径。口径在表上。",
      },
    ],
    lab: {
      id: "r-07-lab",
      lang: "r",
      title: "城市 GMV 表，并画柱状图",
      prompt: "支付成功按 city 加总 pay_amount，最后一行留着这张表。可以顺便 barplot，核对看的是表。",
      hint: "和第四课同一张表。画图用 barplot(tab$pay_amount, names.arg = tab$city)。",
      starter:
        "paid <- orders[orders$status == \"paid\", ]\ntab <- aggregate(pay_amount ~ city, data = paid, FUN = sum)\n# 可以 barplot；最后一行留 tab",
      expectedSql:
        "paid <- orders[orders$status == \"paid\", ]\ntab <- aggregate(pay_amount ~ city, data = paid, FUN = sum)\ntab",
    },
  },
  {
    id: "r-08",
    track: "r",
    order: 8,
    title: "R 的本职：这 0.3% 算涨吗",
    minutes: 14,
    summary: "显著性不是宗教。它回答「差得像不像随机噪声」，不回答「该不该把预算全切过去」。",
    blocks: [
      {
        type: "p",
        text: "达人渠道客单价看起来比信息流高。运营会说「达人更好，预算切过去」。你要回答两层：第一，这个差会不会只是抽到的单不够多、碰巧高了（t.test / prop.test）；第二，就算差是真的，是不是品类不同、人群不同，切预算会不会伤拉新。R 擅长第一层。第二层仍要靠拆表和常识。",
      },
      {
        type: "code",
        code: "paid <- orders[orders$status == \"paid\" & !is.na(orders$pay_amount), ]\ntalent <- paid$pay_amount[paid$channel == \"达人\"]\nfeed <- paid$pay_amount[paid$channel == \"信息流\"]\nmean(talent); mean(feed)\ntt <- t.test(talent, feed)\ntt$p.value\nround(tt$p.value, 4)\n\n# 转化率用 prop.test(成功数, 人数)\n# Python: scipy.stats.ttest_ind(talent, feed)",
      },
      {
        type: "ul",
        items: [
          "p 值小：在「两边其实没差」的前提下，抽到这么大差别很罕见。不是「有 95% 把握达人更好」。",
          "p 值大：还不能说没差，可能是单太少。要报样本量。",
          "实际意义：客单差 2 块和差 80 块，对补贴策略完全不同。只报 p 是学生作业。",
          "这不是随机实验。达人可能本来就接高客单品。显著 ≠ 因果。要因果，回到 AB 课：先留对照。",
        ],
      },
      {
        type: "callout",
        title: "和老板怎么说",
        text: "「达人客单明显高于信息流，不像抽样本抽出来的。但这是渠道结构，不是我改了达人素材。要验证素材，得做实验，不能靠这次对比直接切预算。」",
      },
    ],
    quiz: [
      {
        id: "r-08-q1",
        prompt: "p = 0.04 最接近哪句人话？",
        options: [
          "有 96% 的概率达人更好",
          "如果两边其实没差，抽到这么大差别比较少见",
          "应该立刻切全部预算",
          "Python 会得到不同的 p",
        ],
        answer: 1,
        why: "p 不是「更好的概率」。它是「没差的世界里，这个结果有多尴尬」。",
      },
      {
        id: "r-08-q2",
        prompt: "两组客单差很多，但每组只有 5 单。你该？",
        options: [
          "p 小就上线",
          "先报样本太小，结论不稳定，补样本或改用实验",
          "改用饼图",
          "把 NA 填成 0 让 n 变大",
        ],
        answer: 1,
        why: "显著性和样本量绑在一起。小样本的「显著」很脆。",
      },
      {
        id: "r-08-q3",
        prompt: "为什么「达人客单显著更高」仍不能直接切信息流预算？",
        options: [
          "R 算错了",
          "这不是随机分流，渠道接的人/货可能本来就不同，没有因果",
          "信息流一定更赚钱",
          "SQL 不能切预算",
        ],
        answer: 1,
        why: "观察对比能说「不一样」，不能说「因为是达人所以高」。因果靠实验。",
      },
    ],
    lab: {
      id: "r-08-lab",
      lang: "r",
      title: "达人 vs 信息流客单价，给出 p 值",
      prompt: "支付成功且金额非空。达人一组、信息流一组，做 t.test。最后一行写出 round(tt$p.value, 4)。",
      hint: "先筛 paid 且 !is.na(pay_amount)，再按 channel 切两向量，t.test 之后取 p.value。",
      starter:
        "paid <- orders[orders$status == \"paid\" & !is.na(orders$pay_amount), ]\ntalent <- paid$pay_amount[paid$channel == \"达人\"]\nfeed <- paid$pay_amount[paid$channel == \"信息流\"]\n# t.test，最后 round(p 值, 4)",
      expectedSql:
        "paid <- orders[orders$status == \"paid\" & !is.na(orders$pay_amount), ]\ntalent <- paid$pay_amount[paid$channel == \"达人\"]\nfeed <- paid$pay_amount[paid$channel == \"信息流\"]\ntt <- t.test(talent, feed)\nround(tt$p.value, 4)",
    },
  },
  {
    id: "r-09",
    track: "r",
    order: 9,
    title: "收口：什么问题用什么语言",
    minutes: 12,
    summary: "把 SQL / Excel / Python / R 放回工作流里。你要的是交得出结论，不是证明四门都会。",
    blocks: [
      {
        type: "h",
        text: "默认工作流（分析师）",
      },
      {
        type: "ul",
        items: [
          "口径和取数：SQL。大表、分区、状态、去测试单，都在仓库解决。",
          "临时给业务拖：Excel。透视、批注、他们自己改筛选。",
          "已经是小表，要检验、回归、出统计图：R。实验复盘、策略专题常用。",
          "要每天跑、接 API、进模型、和工程合仓：Python。",
        ],
      },
      {
        type: "h",
        text: "同一句话，四种错法",
      },
      {
        type: "ul",
        items: [
          "「昨日 GMV」去写 Python 循环：能出数，但不可维护，也没人帮你审口径。",
          "「这 0.4 个点算不算」只用 SQL 除法：你交了差值，没交不确定性。",
          "「把推荐模型上线」用 R Markdown：研究可以，工程默认不收。",
          "「让运营自己看城市明细」只给 ggplot：他们改不了筛选，下周还来问你。",
        ],
      },
      {
        type: "code",
        code: "# 还容易学混的几处，贴显示器旁边：\n# 下标    R: 1     Python: 0\n# 逻辑    TRUE     True\n# 缺失    NA       None / NaN   （默认：R 会吵，pandas 会偷偷跳过）\n# 且      &        &\n# 取列    $        [\"col\"]\n# 聚合    aggregate / dplyr     groupby\n# 检验    t.test / lm           scipy / statsmodels",
      },
      {
        type: "callout",
        title: "入职第一周怎么用 R",
        text: "先别重构别人的 SQL。先把实验、抽样调研、回归专题接下来。日常看板继续 SQL。等你能用 R 挡住一次「看这不就涨了」的错误决策，这门课才算值回票价。",
      },
      {
        type: "p",
        text: "dplyr / ggplot2 / RStudio 入职后再装。实验室故意停在基础 R：筛选、汇总、接表、NA、检验。这些会了，包只是把同一句话写得更像 SQL。",
      },
    ],
    quiz: [
      {
        id: "r-09-q1",
        prompt: "推荐「相似商品」要明天进主站，你用什么交付？",
        options: ["R 的 lm 截图", "Python 服务 / 和工程约定的脚本", "Excel 透视", "只写 SQL 注释"],
        answer: 1,
        why: "上线是工程路径。R 可以研究，交付物要对方接得住。",
      },
      {
        id: "r-09-q2",
        prompt: "活动结束后，要判断实验组下单率是不是真高了。首选？",
        options: [
          "只看大盘 GMV",
          "SQL 取出两组转化，R 做比例检验，并报告样本和实际差",
          "Python 爬竞品",
          "把饼图画大一点",
        ],
        answer: 1,
        why: "取数 SQL，判断 R。这是本课程的标准动作。",
      },
      {
        id: "r-09-q3",
        prompt: "你有 Python 基础，学 R 时最该防的是？",
        options: [
          "函数名叫什么",
          "下标从 0 抄过来、空值被默默处理，数字对不上还不知道",
          "不会画 3D 图",
          "SQL 会因此忘记",
        ],
        answer: 1,
        why: "像的地方最容易混。下标和 NA 会让周报和仓库差一截。",
      },
    ],
  },
];
