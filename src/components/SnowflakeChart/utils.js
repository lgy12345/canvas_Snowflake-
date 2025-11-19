// 常量配置
export const CHART_CONFIG = {
  centerX: 200,
  centerY: 200,
  maxRadius: 125,
  maxScore: 7,
  dimensions: ['value', 'future', 'past', 'health', 'dividend'],
  scaleRatio: 1.08,
  clipRadius: 160, // maxRadius + 35
};

// 计算颜色（从 #FF2B2B 红色到 #00E613 绿色，0-60%为黄色区域）
// #FF2B2B → HSL(0°, 100%, 58%)
// 黄色区域 → HSL(60°, 100%, 60%)
// #00E613 → HSL(125°, 100%, 45%)
export const calculateColor = (scores, maxScore = CHART_CONFIG.maxScore) => {
  const total = scores.reduce((sum, s) => sum + s, 0);
  const maxTotal = maxScore * scores.length;
  const normalized = total / maxTotal;
  
  // 使用分段插值：0-60%为黄色区域，60-100%变绿
  let hue, lightness;
  
  if (normalized < 0.6) {
    // 前60%：红色(0°) → 黄色(60°)
    const t = normalized / 0.6; // 0 → 1
    hue = 0 + 60 * t;
    lightness = 58 + (60 - 58) * t; // 58% → 60%
  } else {
    // 后40%：黄色(60°) → 绿色(125°)
    const t = (normalized - 0.6) / 0.4; // 0 → 1
    hue = 60 + (125 - 60) * t;
    lightness = 60 + (45 - 60) * t; // 60% → 45%
  }
  
  const saturation = 100;
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// 计算贝塞尔曲线控制点
export const calculateControlPoints = (p1, p2, centerX, centerY) => {
  const angle1 = Math.atan2(p1.y - centerY, p1.x - centerX);
  const angle2 = Math.atan2(p2.y - centerY, p2.x - centerX);
  
  let angleDiff = angle2 - angle1;
  if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
  
  const r1 = Math.sqrt((p1.x - centerX) ** 2 + (p1.y - centerY) ** 2);
  const r2 = Math.sqrt((p2.x - centerX) ** 2 + (p2.y - centerY) ** 2);
  
  // 使用平均半径来计算控制点距离，使曲线更平滑
  const avgRadius = (r1 + r2) / 2;
  const controlPointDistance = (4 / 3) * Math.tan(angleDiff / 4);
  
  const cp1 = {
    x: p1.x + Math.cos(angle1 + Math.PI / 2) * avgRadius * controlPointDistance,
    y: p1.y + Math.sin(angle1 + Math.PI / 2) * avgRadius * controlPointDistance
  };
  
  const cp2 = {
    x: p2.x + Math.cos(angle2 - Math.PI / 2) * avgRadius * controlPointDistance,
    y: p2.y + Math.sin(angle2 - Math.PI / 2) * avgRadius * controlPointDistance
  };
  
  return { cp1, cp2 };
};

// 检测鼠标所在的扇形区域
export const detectSection = (x, y, centerX, centerY, maxRadius, dimensionsLength) => {
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance > maxRadius) return null;
  
  // 计算角度并调整为从正上方开始
  let angle = Math.atan2(dy, dx) + Math.PI / 2;
  if (angle < 0) angle += Math.PI * 2;
  
  // 添加半个扇形角度的偏移，使边界检测更准确
  const sectionAngle = (2 * Math.PI) / dimensionsLength;
  const adjustedAngle = angle + sectionAngle / 2;
  
  let sectionIndex = Math.floor(adjustedAngle / sectionAngle);
  if (sectionIndex >= dimensionsLength) sectionIndex = 0;
  
  return sectionIndex >= 0 && sectionIndex < dimensionsLength ? sectionIndex : 0;
};

// 计算 tooltip 显示位置
export const calculateTooltipPosition = (section, rect, centerX, centerY, maxRadius, dimensionsLength) => {
  const sectionAngle = (section * 2 * Math.PI) / dimensionsLength - Math.PI / 2;
  const tooltipRadius = maxRadius * 0.7;
  const tooltipCanvasX = centerX + Math.cos(sectionAngle) * tooltipRadius;
  const tooltipCanvasY = centerY + Math.sin(sectionAngle) * tooltipRadius;
  
  return {
    x: rect.left + tooltipCanvasX,
    y: rect.top + tooltipCanvasY
  };
};

// 提取分数数据（使用 Map 和 reduce 进行高效的数据转换）
export const extractScores = (data, dimensions) => {
  const dataMap = data.reduce((map, item) => {
    map.set(item.name, item.value);
    return map;
  }, new Map());
  
  return dimensions.map(dim => dataMap.get(dim) || 0);
};
