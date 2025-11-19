import { useRef, useEffect, useState, useCallback } from 'react';
import './SnowflakeChart.css';

const SnowflakeChart = ({ 
  data, 
  type = 'COMPANY', 
  highlightSection = null,
  onSectionClick = null 
}) => {
  const canvasRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  const dimensions = ['value', 'future', 'past', 'health', 'dividend'];
  const maxScore = 7;
  const centerX = 200;
  const centerY = 200;
  const maxRadius = 125;

  // 计算颜色
  const calculateColor = useCallback((scores) => {
    const total = scores.reduce((sum, s) => sum + s, 0);
    const maxTotal = maxScore * scores.length;
    const normalized = total / maxTotal;
    
    const startHue = 0; // 红色
    const endHue = 120; // 绿色
    const hue = startHue + (endHue - startHue) * normalized;
    
    return `hsl(${hue}, 100%, 50%)`;
  }, []);

  // 计算贝塞尔曲线控制点（优化为圆形）
  const calculateControlPoints = (p1, p2) => {
    // 计算两点对应的角度
    const angle1 = Math.atan2(p1.y - centerY, p1.x - centerX);
    const angle2 = Math.atan2(p2.y - centerY, p2.x - centerX);
    
    // 计算角度差
    let angleDiff = angle2 - angle1;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    
    // 计算两点的半径
    const r1 = Math.sqrt((p1.x - centerX) ** 2 + (p1.y - centerY) ** 2);
    const r2 = Math.sqrt((p2.x - centerX) ** 2 + (p2.y - centerY) ** 2);
    
    // 使用圆形贝塞尔曲线的标准控制点距离
    // 对于圆形，控制点距离 = 半径 * 4/3 * tan(角度/4)
    const controlPointDistance = (4 / 3) * Math.tan(angleDiff / 4);
    
    const cp1 = {
      x: p1.x + Math.cos(angle1 + Math.PI / 2) * r1 * controlPointDistance,
      y: p1.y + Math.sin(angle1 + Math.PI / 2) * r1 * controlPointDistance
    };
    
    const cp2 = {
      x: p2.x + Math.cos(angle2 - Math.PI / 2) * r2 * controlPointDistance,
      y: p2.y + Math.sin(angle2 - Math.PI / 2) * r2 * controlPointDistance
    };
    
    return { cp1, cp2 };
  };

  // 绘制外部矩形背景
  const drawBackground = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 400, 400);
    gradient.addColorStop(0, '#394353');   
    gradient.addColorStop(0.3, '#4d5766');  
    gradient.addColorStop(0.6, '#6b7482');  
    gradient.addColorStop(1, '#9aa1ad');    
    ctx.fillStyle = gradient;
    
    // 绘制圆角矩形
    const radius = 20;
    const width = 400;
    const height = 400;
    ctx.beginPath();
    // 从左上角开始，顺时针绘制
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
  const drawZeroStateRings = (ctx) => {
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
        
        // 使用深色填充
        if (ring === 1 || ring === 2) {
          ctx.fillStyle = '#374151';
        } else {
          ctx.fillStyle = ring % 2 === 0 ? '#374151' : '#2d3748';
        }
        ctx.fill();
      });
    }
    
    // 绘制维度分隔线（从圆心到外圈的直线）
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
  const drawAxes = (ctx) => {
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
  const drawSingleDimensionLine = (ctx, scores) => {
    scores.forEach((score, index) => {
      if (score > 0) {
        const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2;
        const radius = (score / maxScore) * maxRadius;
        const endX = centerX + Math.cos(angle) * radius;
        const endY = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = calculateColor(scores);
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  // 绘制雪花图形
  const drawSnowflake = (ctx, scores, isHighlight = false) => {
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
      const { cp1, cp2 } = calculateControlPoints(p1, p2);
      
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    }

    ctx.closePath();
    
    const color = calculateColor(scores);
    // 始终显示完整颜色填充，降低不透明度
    ctx.fillStyle = color;
    ctx.globalAlpha = isHighlight ? 0.7 : 0.5;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // 添加描边使图形更清晰
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
  // 逻辑：1. 先绘制扇形背景覆盖渐变 2. 设置裁剪区域 3. 在裁剪区域内放大绘制圆环和雪花图
  const drawHighlightedSection = (ctx, scores, sectionIndex) => {
    if (sectionIndex === null) return;

    const sectionAngle = (2 * Math.PI) / dimensions.length;
    const centerAngle = sectionIndex * sectionAngle - Math.PI / 2;
    const angle1 = centerAngle - sectionAngle / 2;
    const angle2 = centerAngle + sectionAngle / 2;
    const scaleRatio = 1.08; // 放大比例
    const clipRadius = maxRadius + 35; // 裁剪半径，延伸到标签位置

    // 创建裁剪路径，限制绘制区域为高亮扇形
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, clipRadius, angle1, angle2);
    ctx.closePath();
    ctx.clip();

    // 步骤3: 在裁剪区域内绘制放大的内容
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scaleRatio, scaleRatio);
    ctx.translate(-centerX, -centerY);

    // 3.1 绘制放大的圆环背景（只绘制当前扇形区域）
    for (let ring = 1; ring <= 7; ring++) {
      const innerRadius = (maxRadius / 7) * (ring - 1);
      const outerRadius = (maxRadius / 7) * ring;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, angle1, angle2);
      ctx.arc(centerX, centerY, innerRadius, angle2, angle1, true);
      ctx.closePath();
      
      if (ring === 1 || ring === 2) {
        ctx.fillStyle = '#374151';
      } else {
        ctx.fillStyle = ring % 2 === 0 ? '#374151' : '#2d3748';
      }
      ctx.fill();
    }

    // 3.2 绘制放大的中心维度刻度线
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 1;
    const centerLineX = centerX + Math.cos(centerAngle) * maxRadius;
    const centerLineY = centerY + Math.sin(centerAngle) * maxRadius;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerLineX, centerLineY);
    ctx.stroke();

    // 3.3 绘制放大的雪花图
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
      const { cp1, cp2 } = calculateControlPoints(p1, p2);
      
      ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    }

    ctx.closePath();
    
    const color = calculateColor(scores);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // 恢复变换和裁剪
    ctx.restore();
    ctx.restore();
  };

  // 绘制高亮遮罩 - 只在圆盘区域遮罩，让其他扇形变暗
  const drawHighlightMask = (ctx, sectionIndex) => {
    if (sectionIndex === null) return;

    const sectionAngle = (2 * Math.PI) / dimensions.length;
    const centerAngle = sectionIndex * sectionAngle - Math.PI / 2;
    const angle1 = centerAngle - sectionAngle / 2;
    const angle2 = centerAngle + sectionAngle / 2;
    
    // 创建遮罩路径（圆盘区域减去高亮扇形）
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    
    ctx.beginPath();
    // 绘制整个圆盘
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    // 减去高亮扇形区域（使用反向路径）
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, maxRadius * 1.1, angle2, angle1, true);
    ctx.closePath();
    
    ctx.fill('evenodd');
    ctx.restore();
  };

  // 检测点击的扇形
  const detectSection = (x, y) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > maxRadius) return null;
    
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;
    
    const sectionAngle = (2 * Math.PI) / dimensions.length;
    const sectionIndex = Math.floor(angle / sectionAngle);
    
    return sectionIndex;
  };

  // 渲染
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 320, 320);
    
    const scores = dimensions.map((dim) => {
      const item = data.find(d => d.name === dim);
      return item ? item.value : 0;
    });

    const totalScore = scores.reduce((sum, s) => sum + s, 0);
    const nonZeroCount = scores.filter(s => s > 0).length;
    
    // 始终绘制背景、轴线和同心圆环
    drawBackground(ctx);
    drawAxes(ctx);
    drawZeroStateRings(ctx);
    
    // 如果有数据
    if (totalScore > 0) {
      // 只有一个维度有值时，绘制线条
      if (nonZeroCount === 1) {
        drawSingleDimensionLine(ctx, scores);
      } else {
        // 多个维度有值时，绘制雪花图
        drawSnowflake(ctx, scores, false);
        
        // TOC 模式下绘制高亮效果
        if (type === 'TOC' && highlightSection !== null) {
          // 先绘制遮罩让其他区域变暗
          drawHighlightMask(ctx, highlightSection);
          // 再绘制放大的高亮区域（包括圆环背景和雪花图）
          drawHighlightedSection(ctx, scores, highlightSection);
        }
      }
    }
  }, [data, type, highlightSection, hoveredSection, dimensions, calculateColor]);

  // 鼠标事件
  const handleMouseMove = (e) => {
    if (type !== 'COMPANY') return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const section = detectSection(x, y);
    setHoveredSection(section);
    
    if (section !== null) {
      const dimData = data[section];
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        data: dimData
      });
    } else {
      setTooltip({ visible: false, x: 0, y: 0, data: null });
    }
  };

  const handleMouseLeave = () => {
    setHoveredSection(null);
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  };

  const handleClick = (e) => {
    if (type !== 'COMPANY' || !onSectionClick) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const section = detectSection(x, y);
    if (section !== null) {
      onSectionClick(section);
    }
  };

  return (
    <div className="snowflake-container">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ cursor: type === 'COMPANY' ? 'pointer' : 'default' }}
      />
      
      {/* 维度标签 */}
      <div className="labels">
        {dimensions.map((dim, index) => {
          const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2;
          
          // 判断是否是高亮的标签
          const isHighlighted = type === 'TOC' && highlightSection === index;
          const scale = isHighlighted ? 1.08 : 1;
          const labelRadius = isHighlighted ? (maxRadius + 30) * 1.08 : maxRadius + 30;
          
          const x = centerX + Math.cos(angle) * labelRadius;
          const y = centerY + Math.sin(angle) * labelRadius;
          
          // 计算文字旋转角度，使其沿着圆弧排列
          // 角度转换为度数，并调整方向
          const rotationAngle = (angle * 180 / Math.PI) + 90;
          
          return (
            <div
              key={dim}
              className="label"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(-50%, -50%) rotate(${rotationAngle}deg) scale(${scale})`,
                transition: 'all 0.3s ease'
              }}
            >
              {dim.toUpperCase()}
            </div>
          );
        })}
      </div>
      
      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="tooltip"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`
          }}
        >
          <div className="tooltip-title">{tooltip.data.name.toUpperCase()}</div>
          <div className="tooltip-desc">{tooltip.data.description}</div>
          <div className="tooltip-sections">
            {tooltip.data.section.map((active, i) => (
              <div
                key={i}
                className={`section-dot ${active ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SnowflakeChart;
