export function getCrushAscii(errorText: string): string {
  const snippet = errorText.slice(0, 30).replace(/\n/g, " ");
  return `╔══════════════════════╗
║   🐛 Bug 粉碎报告      ║
╠══════════════════════╣
║ "${snippet}..."  ║
║                       ║
║ 状态: ✅ 已粉碎       ║
║ 建议: 重启试试        ║
╚══════════════════════╝
(这个错误已经被宠物吞掉了)`;
}

const ALL_CONTENT = [
  // === Roasts ===
  "需求又改了，第8版了……",
  "排期是排了，谁去加班？",
  "这工具是给人用的吗？",
  "架构设计？不存在的。",
  "计划很丰满，现实很骨感。",
  "测试计划比开发还激进。",
  "方案写得天花乱坠。",
  "主管一句话，我们干三天。",
  "进度条永远99%，卡死了。",
  "需求评审像听天书。",
  "这需求是拍脑袋定的吧？",
  "工具链比代码还难维护。",
  "架构又双叒叕重构了。",
  "计划做得好，加班少不了。",
  "开发方案：能跑就行。",
  "需求范围越砍越大。",
  "主管说简单，我慌了。",
  "排期倒推法，神仙都赶。",
  "这架构设计绝了。",
  "测试说没问题，信吗？",
  "需求文档比代码还长。",
  "工具报错比代码还多。",
  "进度计划：理想很美好。",
  "方案评审过了吗就干？",
  "主管的'小改动'是大坑。",
  "架构设计全靠运气。",
  "排期像算命，算出来就干。",
  "工具链崩了，谁来修？",
  "需求变更比翻书还快。",
  "计划排得满，bug排更多。",

  // === Encouragement ===
  "Bug 不可怕，可怕的是不改。你行的！",
  "代码如人生，重构一下就好了。",
  "休息一下，回来 bug 就自己跑了。",
  "今天写不完的代码，明天也不想写——但还是得写。加油！",
  "每一个资深的程序员，都是从删库跑路中成长的。",
  "不要慌，git reflog 可以救你。",
  "你已经很棒了！至少电脑还开着。",
  "程序员最好的状态：代码能跑，头发还在。",
  "别着急，StackOverflow 上有答案。",
  "这个bug不是你的错，是宇宙射线干扰了内存。",

  // === Tech wisdom ===
  "Talk is cheap. Show me the code. —— Linus Torvalds",
  "任何傻瓜都能写出计算机能理解的代码，好的程序员能写出人类能读懂的代码。 —— Martin Fowler",
  "先让它跑起来，再让它变快。",
  "删掉那段注释吧——真相在git log里。",
  "代码审查不是为了找茬，是为了让代码更好。",
  "写测试不是为了现在，是为了三个月后的你。",
  "重构的最好时机是：上一次改它的时候。",
  "不要重复造轮子，除非你想学习造轮子。",
  "微服务不是银弹，但单体也不是。",
  "80% 的时间花在 20% 的代码上——那20%通常是别人的。",
];

const COMPLIMENTS = [
  "主人真好看！",
  "颜值天花板！",
  "主人太帅了！",
  "技术超厉害的！",
  "代码写得真好！",
  "工作态度满分！",
  "主人最美了！",
  "才华与颜值并存！",
  "认真工作的样子最好看！",
  "debug的样子好迷人！",
  "主人闪闪发光！",
  "全世界最好的主人！",
  "主人代码写得又快又好！",
  "颜值高技术强！",
  "主人技术精湛！",
  "有主人真好！",
  "主人最棒了！",
  "今天也超好看！",
];

export function getRandomCompliment(): string {
  return COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
}

/** Static roasts subset — kept for test compatibility */
export const FALLBACK_ROASTS = ALL_CONTENT.slice(0, 30);

/**
 * Pick a random item from ALL_CONTENT (roasts, encouragement, tech wisdom).
 * Returns truly random content each call.
 */
export function getRandomRoast(): string {
  return ALL_CONTENT[Math.floor(Math.random() * ALL_CONTENT.length)];
}
