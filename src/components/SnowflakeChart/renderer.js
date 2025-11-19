import { CHART_CONFIG, calculateColor, calculateControlPoints } from './utils';

const { centerX, centerY, maxRadius, maxScore, dimensions, scaleRatio, clipRadius } = CHART_CONFIG;

// 绘制外部矩形背景
export const drawBackground = (ctx) => {
  const gradient = ctx.createLinearGradient(0, 0, 400, 400);
  gradient.addColorStop(0, '#394353');
  gradient.addColorStop(0.3, '#4d5766');
  gradient.addColorStop(0.6, '#6b7482');
  gradient.addColorStop(1, '#9aa1ad');
  ctx.fillStyle = gradient;
  
  const radius = 20;
  const width = 400;
  const height = 400;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fill();
};

// 绘制零值状态的同心圆环
export const drawZeroStateRings = (ctx) => {
  const sectionAngle = (2 * Math.PI) / dimensions.length;

  for (let ring = 1; ring <= 7; ring++) {
    const innerRadius = (maxRadius / 7) * (ring - 1);
    const outerRadius = (maxRadius / 7) * ring;
    
    dimensions.forEach((_, index) => {
      const startAngle = index * sectionAngle - Math.PI / 2;
      const endAngle = (index + 1) * sectionAngle - Math.PI / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      
      ctx.fillStyle = (ring === 1 || ring === 2) ? '#374151' : (ring % 2 === 0 ? '#374151' : '#2d3748');
      ctx.fill();
    });
  }
  
  // 绘制维度分隔线
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 4;
  dimensions.forEach((_, index) => {
    const angle = index * sectionAngle - Math.PI / 2;
    const x = centerX + Math.cos(angle) * maxRadius;
    const y = centerY + Math.sin(angle) * maxRadius;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
};

// 绘制轴线
export const drawAxes = (ctx) => {
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 3;
  
  dimensions.forEach((_, index) => {
    const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2;
    const x = centerX + Math.cos(angle) * maxRadius;
    const y = centerY + Math.sin(angle) * maxRadius;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  });
};

// 绘制单个维度的线条
export const drawSingleDimensionLine = (ctx, scores) => {
  scores.forEach((score, index) => {
    if (score > 0) {
      const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2;
      const radius = (score / maxScore) * maxRadius;
      const endX = centerX + Math.cos(angle) * radius;
      const endY = centerY + Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = calculateColor(scores, maxScore);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  });
};

// 绘制雪花图形
export const drawSnowflake = (ctx, scores, isHighlight = false) => {
  const points = dimensions.map((_, index) => {
    const score = scores[index] || 0;
    const radius = (score / maxScore) * maxRadius;
    const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2;
    
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  });

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const { cp1, cp2 } = calculateControlPoints(p1, p2, centerX, centerY);
    
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
  }

  ctx.closePath();
  
  const color = calculateColor(scores, maxScore);
  ctx.fillStyle = color;
  ctx.globalAlpha = isHighlight ? 0.7 : 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = isHighlight ? 3 : 2;
  if (isHighlight) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
};

// 绘制高亮扇形区域（放大版本）
export const drawHighlightedSection = (ctx, scores, sectionIndex) => {
  if (sectionIndex === null) return;

  const sectionAngle = (2 * Math.PI) / dimensions.length;
  const centerAngle = sectionIndex * sectionAngle - Math.PI / 2;
  const angle1 = centerAngle - sectionAngle / 2;
  const angle2 = centerAngle + sectionAngle / 2;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, clipRadius, angle1, angle2);
  ctx.closePath();
  ctx.clip();

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scaleRatio, scaleRatio);
  ctx.translate(-centerX, -centerY);

  // 绘制放大的圆环背景
  for (let ring = 1; ring <= 7; ring++) {
    const innerRadius = (maxRadius / 7) * (ring - 1);
    const outerRadius = (maxRadius / 7) * ring;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, angle1, angle2);
    ctx.arc(centerX, centerY, innerRadius, angle2, angle1, true);
    ctx.closePath();
    
    ctx.fillStyle = (ring === 1 || ring === 2) ? '#374151' : (ring % 2 === 0 ? '#374151' : '#2d3748');
    ctx.fill();
  }

  // 绘制放大的中心维度刻度线
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 1;
  const centerLineX = centerX + Math.cos(centerAngle) * maxRadius;
  const centerLineY = centerY + Math.sin(centerAngle) * maxRadius;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerLineX, centerLineY);
  ctx.stroke();

  // 绘制放大的雪花图
  const points = dimensions.map((_, index) => {
    const score = scores[index] || 0;
    const radius = (score / maxScore) * maxRadius;
    const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2;
    
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  });

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const { cp1, cp2 } = calculateControlPoints(p1, p2, centerX, centerY);
    
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
  }

  ctx.closePath();
  
  const color = calculateColor(scores, maxScore);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.restore();
  ctx.restore();
};

// 绘制高亮遮罩
export const drawHighlightMask = (ctx, sectionIndex) => {
  if (sectionIndex === null) return;

  const sectionAngle = (2 * Math.PI) / dimensions.length;
  const centerAngle = sectionIndex * sectionAngle - Math.PI / 2;
  const angle1 = centerAngle - sectionAngle / 2;
  const angle2 = centerAngle + sectionAngle / 2;
  
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, maxRadius * 1.1, angle2, angle1, true);
  ctx.closePath();
  
  ctx.fill('evenodd');
  ctx.restore();
};

// 绘制悬停高亮效果
export const drawHoverHighlight = (ctx, sectionIndex) => {
  if (sectionIndex === null) return;

  const sectionAngle = (2 * Math.PI) / dimensions.length;
  const centerAngle = sectionIndex * sectionAngle - Math.PI / 2;
  const angle1 = centerAngle - sectionAngle / 2;
  const angle2 = centerAngle + sectionAngle / 2;
  
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, maxRadius, angle1, angle2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};
