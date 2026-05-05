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
  "这个需求的复杂度，相当于用CSS画3D地球——能实现，但没必要。",
  "这个bug不是你的问题，是电脑觉得你太累了。",
  "产品经理的需求文档，用圣经的篇幅写了三体的复杂度。",
  "你的代码缩进，比我的周末计划还混乱。",
  "这个NullPointerException，已经被我回收了！",
  "你管这叫hotfix？这明明是nuclear option。",
  "项目经理说'加个小功能'，等于在珠峰顶上加避暑山庄。",
  "编译不过？是你的代码在抗议。",
  "这个bug的年龄，比公司里一半实习生的工龄还长。",
  "你的代码不是有bug，是有feature在叛逆期。",
  "这个PR的commit数量，比你这周的咖啡摄入量还多。",
  "你的代码只有机器能看懂——毕竟它是一堆乱码。",
  "这个需求不是需求，是需求经理的幻觉。",
  "你把代码写成这样，编译器都要工伤了。",
  "这个bug的根因是：你上周没写测试。",
  "CTRL+C和CTRL+V是你用得最熟的快捷键吧？",
  "你的log打得比你的commit message还有感情。",
  "这个函数太长了，它应该有自己的邮政编码。",
  "你的TODO注释，比你的实际代码还多。",
  "代码能跑就别动——你的座右铭是吧？",
  "这个注释比代码还老，是上个世纪留下来的吧？",
  "合并冲突不是冲突，是代码在吵架。",
  "你写的不是代码，是给接盘侠的谜题。",
  "这个API设计得很优雅——和你的代码形成鲜明对比。",
  "你管这叫架构？这明明是意大利面条。",
  "这个变量名取得好，没人能猜到它是干什么的。",
  "你的代码质量：能跑、但别问怎么跑的。",
  "这个class的职责太多了，它需要看心理医生。",
  "你的正则表达式让我想起了古代咒语。",
  "删代码比写代码快乐，所以你一直在删需求对吗？",

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
  "你的代码写得真优雅，像诗一样！",
  "这逻辑思维能力，绝了！",
  "Bug见了你都绕道走，真的！",
  "你就是传说中的十倍程序员吧？",
  "这重构思路，教科书级别的！",
  "你的注释写得比文档还好！",
  "跟你结对编程简直是享受。",
  "这命名功底，一看就是老手！",
  "你的PR我都看得赏心悦目。",
  "能写出这种代码的人，一定很帅！",
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
