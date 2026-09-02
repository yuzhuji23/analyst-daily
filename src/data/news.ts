import type { BriefSection, DailyHotspot, NewsCandidate, QuizQuestion } from "../types";
import { newsDrill } from "./newsDrill";

export const NEWS_FEEDS = [
  { url: "https://36kr.com/feed", name: "36氪" },
  { url: "https://www.huxiu.com/rss/0.xml", name: "虎嗅" },
  { url: "https://www.tmtpost.com/rss.xml", name: "钛媒体" },
];

const SKIP =
  /开售|评测|上手|抛光|镜头|卡口|手机壳|游戏皮肤|德玛西亚|英雄联盟皮肤|新品发布会邀请/;

const RULES: { test: RegExp; w: number }[] = [
  { test: /财报|营收|净利润|毛利|GMV|季度|指引/, w: 6 },
  { test: /补贴|满减|优惠|国补|促销|大促/, w: 5 },
  { test: /广告|投放|获客|ROI|CAC|eCPM|信息流/, w: 5 },
  { test: /外卖|即时零售|本地生活|到店|闪购/, w: 5 },
  { test: /短视频|直播|推荐算法|创作者|流量/, w: 4 },
  { test: /AI|大模型|智能体|生成式/, w: 4 },
  { test: /裁员|组织|业务线|战略收缩/, w: 4 },
  { test: /阿里|腾讯|字节|美团|拼多多|京东|快手|抖音|小红书|网易|B站|百度/, w: 3 },
];

const FIRM_RE =
  /阿里巴巴|阿里云|阿里|腾讯音乐|腾讯|字节跳动|字节|美团|拼多多|京东|快手|抖音|小红书|网易|哔哩哔哩|B站|百度|华为|小米集团|小米|苹果|谷歌|微软|亚马逊|OpenAI|ChatGPT|蚂蚁集团|蚂蚁|滴滴|携程|理想汽车|蔚来|小鹏|微博|知乎|得物|闲鱼|淘宝|天猫|盒马|饿了么|大众点评|高德|米哈游|原神|SHEIN|Temu|TikTok|英伟达|NVIDIA|特斯拉|Tesla|三星|索尼|联想|OPPO|vivo|荣耀|科大讯飞|商汤|月之暗面|智谱|深度求索|DeepSeek|爱奇艺|优酷|顺丰|菜鸟|贝壳|链家|BOSS直聘|作业帮|新东方|喜马拉雅|完美世界|三七互娱|心动|美的|格力|海尔|宁德时代|比亚迪/g;

const CANNED_RE =
  /先不用背术语|谁、做了什么、钱和用户会怎么动|别被一个大数带着走|买的人变多了，还是每个人花得更多|先放进获客[、，]留存[、，]变现[、，]成本四格|三种故事完全不同/;

const STOP = /今天|新闻|报道|发布|宣布|显示|表示|称|以及|因为|但是|如果|这个|那个|什么|可以|不是|已经|还是|或者|自己|他们|我们|公司|市场|行业|中国|美国|同比|环比/;

type Lens = "earn" | "subsidy" | "ad" | "local" | "content" | "ai" | "org" | "big" | "generic";

export function scoreNews(title: string, desc: string): number {
  const text = `${title} ${desc}`;
  if (SKIP.test(text)) return 0;
  let s = 0;
  for (const r of RULES) {
    if (r.test.test(text)) s += r.w;
  }
  return s;
}

export function namesIn(text: string): string[] {
  return [...new Set([...text.matchAll(FIRM_RE)].map((m) => m[0]))];
}

export function numbersIn(text: string): string[] {
  const raw = [
    ...text.matchAll(/(?:约|近|超)?[\$￥€]?\d+(?:\.\d+)?(?:万亿|亿|万|%|％|倍|元|美元|人民币|亿元|万人|亿人|亿次|万次|个百分点|pp)?/g),
  ].map((m) => m[0]);
  return [...new Set(raw)].filter((s) => /[万亿%％倍元美人人次点p$￥€]/.test(s) || s.length >= 3).slice(0, 8);
}

export function anchorsIn(title: string, summary: string): string[] {
  const text = `${title} ${summary}`;
  const firms = namesIn(text);
  const bits = title
    .replace(/[【】[\]（）()｜|：:，,。.!！?？“”"'、\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP.test(w));
  return [...new Set([...firms, ...bits])].slice(0, 8);
}

export function isCannedBrief(sections: BriefSection[]): boolean {
  return CANNED_RE.test(sections.flatMap((s) => s.paras).join("\n"));
}

export function isGroundedBrief(sections: BriefSection[], title: string, summary: string): boolean {
  const body = sections.flatMap((s) => s.paras).join("");
  if (CANNED_RE.test(body)) return false;
  const anchors = anchorsIn(title, summary);
  if (!anchors.length) return body.length > 80;
  return anchors.some((a) => body.includes(a));
}

export function isCannedHotspot(item: DailyHotspot): boolean {
  return isCannedBrief(item.sections);
}

function lensOf(text: string): Lens {
  if (/财报|营收|净利润|毛利|GMV|季度|指引/.test(text)) return "earn";
  if (/补贴|满减|优惠|国补|促销|大促/.test(text)) return "subsidy";
  if (/广告|投放|获客|ROI|CAC|eCPM|信息流/.test(text)) return "ad";
  if (/外卖|即时零售|本地生活|到店|闪购/.test(text)) return "local";
  if (/短视频|直播|推荐算法|创作者|流量/.test(text)) return "content";
  if (/AI|大模型|智能体|生成式/.test(text)) return "ai";
  if (/裁员|组织|业务线|战略收缩/.test(text)) return "org";
  if (/阿里|腾讯|字节|美团|拼多多|京东|快手|抖音|小红书|网易|B站|百度/.test(text)) return "big";
  return "generic";
}

function whoOf(title: string, text: string): string {
  return namesIn(text)[0] || title.replace(/[【】[\]（）()｜|：:].*$/, "").trim().slice(0, 12) || "当事方";
}

function clipOf(desc: string): string {
  const clip = desc.replace(/\s+/g, " ").trim();
  if (!clip) return "";
  return clip.length > 360 ? `${clip.slice(0, 360)}…` : clip;
}

function stepsFor(lens: Lens, who: string, headline: string, nums: string[], clip: string): string[] {
  const n0 = nums[0];
  const nJoin = nums.slice(0, 3).join("、");
  const extra = clip ? `摘要里还写到：${clip.length > 80 ? `${clip.slice(0, 80)}…` : clip}` : "摘要没再补事实，下面不编。";
  switch (lens) {
    case "earn":
      return [
        `第一步：${who}这条是${headline}。先把公司和报告期钉死，不要把同行的数填进来。`,
        n0
          ? `第二步：${n0}先对口径——是收入、利润、GMV 还是用户。对上之后再看它变多，是单量起来了，还是客单/单价起来了。稿子没给另一半，就停在「只讲了一半」。`
          : `第二步：标题按财报读，但摘要没把收入拆开。打开原文找收入、订单或活跃用户、平均每单/每人，三个里缺一个，这篇的故事就没写完。`,
        `第三步：${who}如果同时报了费用或补贴，对着新客人看：人还在、花费更省，才是效率；人没了只是在收缩，利润能修，增长会先哑火。`,
        `第四步：${extra}管理层说要增长还是要利润，用这篇里的数核对，对不上就当两套故事。`,
      ];
    case "subsidy":
      return [
        `第一步：${who}在做${headline}。先分清多出来的单是新客人进门，还是老客把本来要买的改成了用券。`,
        n0
          ? `第二步：${n0}如果是活动窗里的成交额，先扣掉货本、履约和补贴，看一单还剩不剩钱。${nJoin ? `稿子里能对上的数：${nJoin}。` : ""}`
          : `第二步：活动热闹不等于留下钱。打开原文找实付、补贴额、停补后的订单，没有这些数就还不能说值不值得续。`,
        `第三步：盯停补之后那一周，${who}的订单和客单还在不在。还在，习惯养住了；一停就塌，是花钱买当天的数。`,
        `第四步：${extra}`,
      ];
    case "ad":
      return [
        `第一步：${who}这条是${headline}。先问这笔投放如果停掉，这些单还会不会在——账面里常混着本来就会来的人。`,
        n0
          ? `第二步：${n0}若是投放花费或广告收入，旁边放次日留存或时长。用体验换收入可以过财季，下个队列会变成流失。`
          : `第二步：打开原文找花费、回报、以及人留下没有。只给点击或曝光，还不能说投放划算。`,
        `第三步：${extra}便宜量往往是最贵的用户，看${who}买来的人多久能把钱赚回来。`,
      ];
    case "local":
      return [
        `第一步：${who}在${headline}。本地生活先算一单：实付减去补贴和履约，还剩不剩钱。`,
        n0
          ? `第二步：${n0}若是成交额或日活，先问密度够不够。密度不够，履约成本下不来，成交额好看也会亏。`
          : `第二步：比日活更早报警的是供给——搜了没结果、超时、核心品买不到。供给没站住就去投用户，钱会从履约和补贴两个口漏。`,
        `第三步：${extra}扩张是投资决策，用${who}这条里的密度和单均，不要拿一线城市成交额去套冷启动城市。`,
      ];
    case "content":
      return [
        `第一步：${who}这条是${headline}。完播和时长是人在看，关注和作者收入才是生态还在。`,
        n0
          ? `第二步：${n0}如果是播放或时长，问一句：作者能不能靠这个赚钱、用户还关不关注。只把前者做高，片子会更好看但记不住。`
          : `第二步：往里塞广告或购物入口时，看${who}的留存有没有为收入让路。短期收入和长期队列经常打架。`,
        `第三步：${extra}消费指标和生态指标要一起看，不能只留一个北星。`,
      ];
    case "ai":
      return [
        `第一步：${who}说${headline}。先问它改的是哪一格：省成本、让任务更容易完成，还是直接带动转化。模型名字本身不是指标。`,
        n0
          ? `第二步：${n0}如果只是参数量、融资或调用次数，还没进业务。要能翻译成客服成本、转化或时长，才算上了分析。`
          : `第二步：模型谁都能买。差别在${who}的数据和流程能不能改漏斗。说不出闭环，按功能更新读，不要按护城河读。`,
        `第三步：${extra}`,
      ];
    case "org":
      return [
        `第一步：${who}在${headline}。先听现在的主目标：停补贴、砍销售费用是利润阶段；还在买量是份额阶段。`,
        `第二步：财报和战略点名的才是核心业务。${who}边缘线的分析编制会先被收。`,
        n0 ? `第三步：${n0}先对上是人数、费用还是业务线。${extra}` : `第三步：${extra}用一句话讲清矛盾——一边要什么、一边要什么，现在用这个动作换哪个数。`,
      ];
    case "big":
      return [
        `第一步：${headline}。先定位${who}落在哪条业务：广告、电商、内容、云还是金融。不同线的核心指标不一样。`,
        n0
          ? `第二步：${n0}先问这次是在份额、利润还是监管里选边。进攻和收缩，后面的数读法相反。`
          : `第二步：大厂动作通常是在份额、利润、监管里选边。判断${who}这次是进攻还是收缩，再读后面的数。`,
        `第三步：${extra}把这条映射到一条业务线和一个具体指标。`,
      ];
    default:
      return [
        `第一步：${who}今天做的是${headline}。先把主语和动作钉死。`,
        n0
          ? `第二步：稿子里的${nJoin}先对口径，再跟昨天或上周比。说不出看什么、和谁比，就还停在标题。`
          : `第二步：${extra}找一个七天内能看到变化的数，和昨天或上周比。`,
        `第三步：想这个动作下个周期会反噬什么，只盯一个数跟下去。`,
      ];
  }
}

function takeFor(lens: Lens, who: string, headline: string, nums: string[]): string[] {
  const n0 = nums[0];
  const tail = n0 ? `这篇里先盯 ${n0} 的口径对不对。` : "这篇里先盯标题里那个动作会改哪个数。";
  const line =
    lens === "earn"
      ? `记住：看${who}这季，先核对管理层在说增长还是利润，再用这篇里的数验证，对不上就当两套故事。`
      : lens === "subsidy"
        ? `记住：看${who}这次活动，值不值得续看一单扣完货本、履约和补贴还剩不剩钱，不看活动窗热闹。`
        : `记住：${who}这条「${headline}」，${tail}`;
  return [line];
}

export function briefFor(title: string, desc: string): BriefSection[] {
  const clip = clipOf(desc);
  const text = `${title} ${clip}`;
  const who = whoOf(title, text);
  const nums = numbersIn(text);
  const headline = title.replace(/[【】[\]]/g, "").trim();
  const what = [`${who}今天这条的动作写在标题里：${headline}。`];
  if (clip) what.push(`稿子接着说：${clip}`);
  else what.push("公开摘要很短，下面只按标题能确定的事实拆，不确定的不补。");
  if (nums.length) {
    what.push(`稿子里点到的数字有 ${nums.slice(0, 4).join("、")}。先对口径，再谈涨跌好不好看。`);
  }
  return [
    { title: "这篇在讲什么", paras: what },
    { title: "跟着看懂", paras: stepsFor(lensOf(text), who, headline, nums, clip) },
    { title: "你要带走的", paras: takeFor(lensOf(text), who, headline, nums) },
  ];
}

export function pickPrompt(catalog: string): string {
  return `选出对互联网数据分析/数据运营岗最值得拆的【一条】。优先：财报数字、补贴与一单赚不赚钱、投放效率、大厂业务动作、竞争。不要：数码评测、纯融资八卦、没有业务可拆的软文。

只输出：{"index":数字}

候选：
${catalog}`;
}

export function teachPrompt(row: { title: string; source: string; summary: string }, extra?: string): string {
  const anchors = anchorsIn(row.title, row.summary);
  const must = anchors.length ? anchors.join("、") : row.title.slice(0, 20);
  return `你在写今天这一条新闻的讲解，不是在写「怎么读财报 / 怎么看补贴」的讲义。

读者是商业基础弱的大四学生。有数字就用人话解释它在这篇里代表什么；稿子没有的事实不要编，写「稿子没给这个数」。术语第一次出现用括号，例如 ARPU（平均每个用户带来的收入）。

硬性要求：
- 每一段都必须点到这篇里的公司、产品或数字。下面这些词至少要反复用到：${must}
- 禁止套话和变体：先不用背术语；谁、做了什么、钱和用户会怎么动；别被一个大数带着走；买的人变多了还是每个人花得更多；先放进获客留存变现成本四格；三种故事完全不同；先建立框架。
- 不要教程式开头。第一句就进入这篇里的人在干什么。
- 「跟着看懂」每一步必须先点这篇的一个事实（公司、产品、数字、动作），再说这个事实意味着钱或用户怎么动。不要写能套到任何财报上的空句子。
- 不要布置作业，不要反问读者。

必须按这个结构写：
1. 「这篇在讲什么」：哪家公司、发生了什么、关键数字、为什么今天值得看。3到5段，每段2到4句。
2. 「跟着看懂」：用「第一步：」这类开头，写 4 到 6 步，步步扣这篇。
3. 「你要带走的」：2到3段。最后一段用「记住：」开头，句子里要有这家公司和这篇里的一个具体判断。

标题：${row.title}
来源：${row.source}
正文摘录：${row.summary || "（摘要很少，请严格按标题能确定的内容写，不确定的标明是推断）"}
${extra ? `\n${extra}\n` : ""}
只输出：{"sections":[{"title":"这篇在讲什么","paras":["",""]},{"title":"跟着看懂","paras":["第一步：", "第二步："]},{"title":"你要带走的","paras":["","记住："]}]}`;
}

export function drillPrompt(row: { title: string; source: string; summary: string }): string {
  const who = namesIn(`${row.title} ${row.summary}`)[0] || "这篇里的公司";
  return `根据这篇新闻出 3 道选择题。读者是商业基础弱的大四学生。

要求：
- 每题 4 个选项，只有 1 个对；answer 是从 0 开始的序号
- 题干必须点到「${who}」或这篇里的一个具体数字/动作，不要出能套到任何公司上的送分题
- why 用一两句人话，也要点这篇
- method 写一段「以后看到${who}这类稿怎么拆」，要提到这篇里的事实，不要只写万能三步

标题：${row.title}
来源：${row.source}
摘录：${row.summary || "（摘要很少，请严格按标题能确定的内容出题）"}

只输出：{"method":"","quiz":[{"prompt":"","options":["","","",""],"answer":0,"why":""},{"prompt":"","options":["","","",""],"answer":1,"why":""},{"prompt":"","options":["","","",""],"answer":2,"why":""}]}`;
}

export function rankCandidates(rows: NewsCandidate[]): NewsCandidate[] {
  const uniq = new Map<string, NewsCandidate>();
  for (const row of rows) {
    if (row.score <= 0) continue;
    const key = row.title.replace(/\s+/g, "");
    const prev = uniq.get(key);
    if (!prev || row.score > prev.score) uniq.set(key, row);
  }
  return Array.from(uniq.values()).sort((a, b) => b.score - a.score);
}

export function toHotspot(
  date: string,
  row: NewsCandidate,
  sections: BriefSection[],
  drill?: { quiz: QuizQuestion[]; method: string },
): DailyHotspot {
  const fallback = newsDrill(row.title, row.summary);
  const quiz = drill?.quiz && drill.quiz.length >= 3 ? drill.quiz : fallback.quiz;
  const method = drill?.method?.trim() || fallback.method;
  return {
    date,
    title: row.title,
    source: row.source,
    url: row.url,
    published: row.published,
    sections,
    quiz,
    method,
  };
}
