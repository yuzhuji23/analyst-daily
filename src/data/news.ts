import type { BriefSection, DailyHotspot, NewsCandidate, QuizQuestion } from "../types";
import { newsDrill } from "./newsDrill";

export const NEWS_FEEDS = [
  { url: "https://36kr.com/feed", name: "36氪" },
  { url: "https://www.huxiu.com/rss/0.xml", name: "虎嗅" },
  { url: "https://www.tmtpost.com/rss.xml", name: "钛媒体" },
];

const SKIP =
  /开售|评测|上手|抛光|镜头|卡口|手机壳|游戏皮肤|德玛西亚|英雄联盟皮肤|新品发布会邀请/;

type Rule = {
  test: RegExp;
  w: number;
  say: string[];
};

const RULES: Rule[] = [
  {
    test: /财报|营收|净利润|毛利|GMV|季度|指引/,
    w: 6,
    say: [
      "别被一个大数带着走。收入要拆成「买的人变多了，还是每个人花得更多」——量涨、价涨，还是一边涨一边掉，三种故事完全不同。",
      "费用降了也不等于变好。销售费用下来时，对照新客：人没了是在收缩投放，人还在才是效率真的好。收缩能把这季利润修好，下个季度增长会先哑火。",
      "带走一句：先判断公司现在要的是增长还是利润，再看管理层说的和数字是不是同一件事。",
    ],
  },
  {
    test: /补贴|满减|优惠|国补|促销|大促/,
    w: 5,
    say: [
      "先别看成促销热闹。多出来的单，要分清是新客人进门，还是老客把本来就要买的改成了用券。后者只是把利润让出去，不是增长。",
      "分析师盯停补之后那一周：订单和客单还在不在。还在，说明习惯养住了；一停就塌，说明只是花钱买当天的数。",
      "带走一句：值不值得续，看一单还能剩多少钱，不看活动窗里的成交额。实付减去货本、履约和补贴，回不了本就别续。",
    ],
  },
  {
    test: /广告|投放|获客|ROI|CAC|eCPM|信息流/,
    w: 5,
    say: [
      "账面回报里经常混着本来就会来的人。先问一句：这笔投放如果停掉，这些单还会不会在。",
      "广告收入往上走时，把时长和次日留存放旁边。用体验换收入可以过财季，下个队列会变成流失。便宜量往往是最贵的用户。",
      "带走一句：投放不只看获客成本，还要看人留下没有、多久能把钱赚回来。",
    ],
  },
  {
    test: /外卖|即时零售|本地生活|到店|闪购/,
    w: 5,
    say: [
      "本地生活的核心不是活跃人数，是一单算完账还剩不剩钱：实付减去补贴和履约。密度不够时，履约成本下不来，成交额好看也会亏。",
      "比日活更早报警的是供给：搜了没结果、超时、核心品类买不到。供给没站住就去投用户，钱会从履约和补贴两个口漏掉。",
      "带走一句：扩张是投资决策。先看密度和单均利润，不要用一线城市的成交额去要求冷启动的城市。",
    ],
  },
  {
    test: /短视频|直播|推荐算法|创作者|流量/,
    w: 4,
    say: [
      "完播和时长是人在看，关注和作者收入才是生态还在。只把前者做高，内容会变成好看但记不住。",
      "往里塞广告或购物入口时，看留存有没有让路。短期收入和长期队列经常打架，要按公司现在处在哪一阶段选边。",
      "带走一句：内容平台不能只盯一个北星，消费指标和生态指标要一起看。",
    ],
  },
  {
    test: /AI|大模型|智能体|生成式/,
    w: 4,
    say: [
      "先放到三格里：是帮人省成本，是让任务更容易完成，还是直接带动转化。模型名字本身不是指标。",
      "模型谁都能买的时候，差别在数据和流程能不能改漏斗。说不出闭环，就按功能更新读，不要按护城河读。",
      "带走一句：把「上了 AI」翻译成会动的数——客服成本、转化或时长——而不是停在产品发布。",
    ],
  },
  {
    test: /裁员|组织|业务线|战略收缩/,
    w: 4,
    say: [
      "先听公司现在的主目标。停补贴、砍销售费用，是利润阶段；还在买量，是份额阶段。你周报里盯的数必须跟这个对齐。",
      "财报和战略点名的才是核心业务。边缘线的分析编制会先被收，求职时优先看编制还在哪条线上。",
      "带走一句：用一句话讲清公司矛盾——一边要 A、一边要 B，现在用某个动作换某个指标。",
    ],
  },
  {
    test: /阿里|腾讯|字节|美团|拼多多|京东|快手|抖音|小红书|网易|B站|百度/,
    w: 3,
    say: [
      "先定位落在哪条业务：广告、电商、内容、云还是金融。不同业务的核心指标不一样，不要拿同一套成交额去套。",
      "大厂动作通常是在份额、利润、监管里选边。判断这次是进攻还是收缩，后面的数据才知道怎么读。",
      "带走一句：把公司新闻映射到业务线和一个具体指标，这就是分析岗读报的基本动作。",
    ],
  },
];

const GENERIC = [
  "先放进获客、留存、变现、成本四格里，只选一个主格。主格决定你今天盯哪个数，其余当背景。",
  "找一个七天内能看到变化的指标，和昨天或上周比。说得出看什么、和谁比，才不是在评论。",
  "带走一句：事实，再拆指标，再想下个周期会反噬什么，最后只盯一个数。",
];

export function scoreNews(title: string, desc: string): number {
  const text = `${title} ${desc}`;
  if (SKIP.test(text)) return 0;
  let s = 0;
  for (const r of RULES) {
    if (r.test.test(text)) s += r.w;
  }
  return s;
}

function sayFor(title: string, desc: string): string[] {
  const text = `${title} ${desc}`;
  const hit = RULES.find((k) => k.test.test(text) && k.w >= 4) ?? RULES.find((k) => k.test.test(text));
  return hit?.say ?? GENERIC;
}

export function briefFor(title: string, desc: string): BriefSection[] {
  const say = sayFor(title, desc);
  const clip = desc.replace(/\s+/g, " ").trim();
  const story = clip
    ? `今天这条新闻的标题是「${title}」。稿子里大致在说：${clip.length > 180 ? `${clip.slice(0, 180)}…` : clip}`
    : `今天这条新闻的标题是「${title}」。摘要比较短，建议先点开原文扫一眼，再回过来看下面的拆解。`;
  return [
    {
      title: "这篇在讲什么",
      paras: [story, "先不用背术语。下面按顺序把这件事拆开，你只要跟着看「谁、做了什么、钱和用户会怎么动」。"],
    },
    {
      title: "跟着看懂",
      paras: say.slice(0, -1),
    },
    {
      title: "你要带走的",
      paras: [say[say.length - 1] ?? GENERIC[2]],
    },
  ];
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
