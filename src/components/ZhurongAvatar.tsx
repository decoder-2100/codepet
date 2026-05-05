import { useState, useEffect } from "react";

/**
 * 祝融号火星机器人头像组件
 * 纯 SVG 实现，白色机身 + 蓝色太阳能板 + 履带底盘 + 摄像头
 * 眼睛每 10 秒眨眼一次
 */
interface Props {
  avatarActive?: boolean;
}

export default function ZhurongAvatar({ avatarActive = false }: Props) {
  const isActive = avatarActive;
  const [blinking, setBlinking] = useState(false);

  // 每 10 秒眨眼一次：闭眼 200ms
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 眨眼时眼睛高度压缩到 10%
  const eyeScaleY = blinking ? 0.1 : 1;

  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}
    >
      {/* 火星沙地 — 波浪形地面 */}
      <path d="M0 105 Q15 98 30 103 Q45 108 60 102 Q75 96 90 101 Q105 106 120 100 L120 120 L0 120 Z" fill="url(#mars-ground)" />
      <path d="M0 110 Q20 105 40 109 Q60 113 80 108 Q100 103 120 107 L120 120 L0 120 Z" fill="url(#mars-ground-dark)" />

      {/* 火星尘土飞溅效果 */}
      <circle cx="18" cy="102" r="1.2" fill="rgba(210,140,80,0.4)" />
      <circle cx="42" cy="106" r="0.8" fill="rgba(210,140,80,0.3)" />
      <circle cx="95" cy="100" r="1" fill="rgba(210,140,80,0.35)" />
      <circle cx="108" cy="104" r="0.6" fill="rgba(210,140,80,0.25)" />

      {/* 远处火星小山丘 */}
      <path d="M0 95 Q10 88 20 93 Q28 87 38 92" fill="none" stroke="rgba(180,100,50,0.2)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M82 90 Q92 84 102 89 Q110 83 120 88" fill="none" stroke="rgba(180,100,50,0.15)" strokeWidth="1" strokeLinecap="round" />

      {/* 渐变定义 */}
      <defs>
        <linearGradient id="mars-ground" x1="0" y1="95" x2="0" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C47A3A" />
          <stop offset="100%" stopColor="#A85C28" />
        </linearGradient>
        <linearGradient id="mars-ground-dark" x1="0" y1="108" x2="0" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="rgba(160,85,35,0.6)" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
      </defs>

      {/* === 履带底盘 === */}
      {/* 火星地面阴影 */}
      <ellipse cx="60" cy="100" rx="30" ry="3" fill="rgba(120,60,20,0.2)" />
      <rect x="24" y="88" width="72" height="16" rx="8" fill="#8B8D92" />
      {/* 履带纹理 */}
      <line x1="34" y1="88" x2="34" y2="104" stroke="#6B6D72" strokeWidth="1.5" />
      <line x1="44" y1="88" x2="44" y2="104" stroke="#6B6D72" strokeWidth="1.5" />
      <line x1="54" y1="88" x2="54" y2="104" stroke="#6B6D72" strokeWidth="1.5" />
      <line x1="64" y1="88" x2="64" y2="104" stroke="#6B6D72" strokeWidth="1.5" />
      <line x1="74" y1="88" x2="74" y2="104" stroke="#6B6D72" strokeWidth="1.5" />
      <line x1="84" y1="88" x2="84" y2="104" stroke="#6B6D72" strokeWidth="1.5" />
      {/* 履带高光 */}
      <rect x="26" y="89" width="68" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />

      {/* === 车身主体 === */}
      <rect x="30" y="44" width="60" height="46" rx="6" fill="#E8EAED" />
      {/* 车身侧面深色条 */}
      <rect x="30" y="78" width="60" height="12" rx="0 0 6 6" fill="#C4C7CC" />
      <rect x="30" y="78" width="60" height="2" fill="#D0D3D8" />

      {/* 中国红标识线 */}
      <rect x="30" y="72" width="60" height="3" fill="#DE2910" rx="1" />

      {/* === 太阳能电池板（蓝色翅片） === */}
      {/* 左翅片 */}
      <rect x="6" y="30" width="22" height="40" rx="3" fill="#2955A3" />
      <rect x="6" y="30" width="22" height="40" rx="3" stroke="#1A3A6E" strokeWidth="0.8" fill="none" />
      {/* 左翅片网格线 */}
      <line x1="14.7" y1="30" x2="14.7" y2="70" stroke="#1A3A6E" strokeWidth="0.6" />
      <line x1="6" y1="40" x2="28" y2="40" stroke="#1A3A6E" strokeWidth="0.6" />
      <line x1="6" y1="50" x2="28" y2="50" stroke="#1A3A6E" strokeWidth="0.6" />
      <line x1="6" y1="60" x2="28" y2="60" stroke="#1A3A6E" strokeWidth="0.6" />
      {/* 左翅片高光 */}
      <rect x="7" y="31" width="20" height="1.5" rx="0.5" fill="rgba(255,255,255,0.2)" />

      {/* 右翅片 */}
      <rect x="92" y="30" width="22" height="40" rx="3" fill="#2955A3" />
      <rect x="92" y="30" width="22" height="40" rx="3" stroke="#1A3A6E" strokeWidth="0.8" fill="none" />
      {/* 右翅片网格线 */}
      <line x1="105.3" y1="30" x2="105.3" y2="70" stroke="#1A3A6E" strokeWidth="0.6" />
      <line x1="92" y1="40" x2="114" y2="40" stroke="#1A3A6E" strokeWidth="0.6" />
      <line x1="92" y1="50" x2="114" y2="50" stroke="#1A3A6E" strokeWidth="0.6" />
      <line x1="92" y1="60" x2="114" y2="60" stroke="#1A3A6E" strokeWidth="0.6" />
      {/* 右翅片高光 */}
      <rect x="93" y="31" width="20" height="1.5" rx="0.5" fill="rgba(255,255,255,0.2)" />

      {/* 翅片连接杆 */}
      <rect x="26" y="46" width="6" height="4" rx="1" fill="#C4C7CC" />
      <rect x="88" y="46" width="6" height="4" rx="1" fill="#C4C7CC" />

      {/* === 摄像头桅杆 === */}
      <rect x="56" y="26" width="8" height="20" rx="2" fill="#C4C7CC" />
      {/* 桅杆高光 */}
      <rect x="57" y="27" width="2" height="18" rx="1" fill="rgba(255,255,255,0.3)" />

      {/* === 摄像头头部（眼睛） === */}
      {/* 头部主体 — 加高以容纳大眼睛 */}
      <rect x="34" y="4" width="52" height="26" rx="6" fill="#E8EAED" />
      <rect x="34" y="4" width="52" height="26" rx="6" stroke="#C4C7CC" strokeWidth="0.8" fill="none" />

      {/* 左眼 — 放大 2 倍，带眨眼缩放 */}
      <g transform={`translate(50, 17) scale(1, ${eyeScaleY})`} style={{ transition: "transform 0.1s ease-in" }}>
        <circle cx="0" cy="0" r="10" fill="#2C2C2E" />
        <circle cx="0" cy="0" r="7" fill="#3A3A3C" />
        {/* 镜头反光 */}
        <circle cx="-3" cy="-3" r="3" fill="rgba(102,126,234,0.6)" />
        <circle cx="-2" cy="-2" r="1.2" fill="rgba(255,255,255,0.7)" />
      </g>

      {/* 右眼 — 放大 2 倍，带眨眼缩放 */}
      <g transform={`translate(70, 17) scale(1, ${eyeScaleY})`} style={{ transition: "transform 0.1s ease-in" }}>
        <circle cx="0" cy="0" r="10" fill="#2C2C2E" />
        <circle cx="0" cy="0" r="7" fill="#3A3A3C" />
        {/* 镜头反光 */}
        <circle cx="-3" cy="-3" r="3" fill="rgba(102,126,234,0.6)" />
        <circle cx="-2" cy="-2" r="1.2" fill="rgba(255,255,255,0.7)" />
      </g>

      {/* 头部高光 */}
      <rect x="39" y="13" width="42" height="2" rx="1" fill="rgba(255,255,255,0.5)" />

      {/* === 车身细节 === */}
      {/* 通信天线 */}
      <line x1="82" y1="44" x2="86" y2="38" stroke="#C4C7CC" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="86" cy="37" r="1.5" fill="#DE2910" />

      {/* 车身散热栅格 */}
      <rect x="36" y="50" width="16" height="10" rx="2" fill="#D0D3D8" />
      <line x1="40" y1="50" x2="40" y2="60" stroke="#B8BBBF" strokeWidth="0.8" />
      <line x1="44" y1="50" x2="44" y2="60" stroke="#B8BBBF" strokeWidth="0.8" />
      <line x1="48" y1="50" x2="48" y2="60" stroke="#B8BBBF" strokeWidth="0.8" />

      {/* 中国国旗标识 */}
      <rect x="70" y="50" width="14" height="10" rx="1.5" fill="#DE2910" />
      {/* 五角星简化（四个小黄点） */}
      <circle cx="74" cy="53.5" r="1" fill="#FFDE00" />
      <circle cx="76.5" cy="52" r="0.6" fill="#FFDE00" />
      <circle cx="76.5" cy="55" r="0.6" fill="#FFDE00" />

      {/* === 激活状态指示灯 === */}
      {isActive && (
        <>
          <circle cx="78" cy="44" r="2" fill="#4ADE80">
            <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="78" cy="44" r="3.5" fill="rgba(74,222,128,0.3)">
            <animate attributeName="r" values="3.5;5;3.5" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur="1s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {/* 车轮连接点 */}
      <circle cx="34" cy="92" r="3" fill="#6B6D72" />
      <circle cx="34" cy="92" r="1.5" fill="#8B8D92" />
      <circle cx="86" cy="92" r="3" fill="#6B6D72" />
      <circle cx="86" cy="92" r="1.5" fill="#8B8D92" />
    </svg>
  );
}
