import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { CHART_CONFIG, detectSection, calculateTooltipPosition, extractScores } from './utils';
import {
  drawBackground,
  drawZeroStateRings,
  drawAxes,
  drawSingleDimensionLine,
  drawSnowflake,
  drawHighlightedSection,
  drawHighlightMask,
  drawHoverHighlight
} from './renderer';
import './SnowflakeChart.css';

const { centerX, centerY, maxRadius, dimensions } = CHART_CONFIG;

const SnowflakeChart = ({ 
  data, 
  type = 'COMPANY', 
  highlightSection = null,
  onSectionClick = null 
}) => {
  const canvasRef = useRef(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  // 提取分数数据（记忆化）
  const scores = useMemo(() => extractScores(data, dimensions), [data]);

  // 计算总分和非零数量（记忆化）
  const { totalScore, nonZeroCount } = useMemo(() => ({
    totalScore: scores.reduce((sum, s) => sum + s, 0),
    nonZeroCount: scores.filter(s => s > 0).length
  }), [scores]);

  // Canvas 渲染逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 400, 400);
    
    // 绘制背景和基础元素
    drawBackground(ctx);
    drawAxes(ctx);
    drawZeroStateRings(ctx);
    
    // 绘制数据
    if (totalScore > 0) {
      if (nonZeroCount === 1) {
        drawSingleDimensionLine(ctx, scores);
      } else {
        drawSnowflake(ctx, scores, false);
        
        // TOC 模式下的高亮效果
        if (type === 'TOC' && highlightSection !== null) {
          drawHighlightMask(ctx, highlightSection);
          drawHighlightedSection(ctx, scores, highlightSection);
        }
      }
    }
    
    // 绘制悬停高亮
    if ((type === 'TOC' && highlightSection === null && hoveredSection !== null) || 
        (type === 'COMPANY' && hoveredSection !== null)) {
      drawHoverHighlight(ctx, hoveredSection);
    }
  }, [scores, totalScore, nonZeroCount, type, highlightSection, hoveredSection]);

  // 鼠标移动处理（使用 useCallback 优化性能）
  const handleMouseMove = useCallback((e) => {
    if (type !== 'COMPANY' && !(type === 'TOC' && highlightSection === null)) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const section = detectSection(x, y, centerX, centerY, maxRadius, dimensions.length);
    
    // 使用函数式更新避免闭包问题
    setHoveredSection(prevHovered => {
      if (section !== prevHovered) {
        // 更新 tooltip
        if (section !== null) {
          const dimData = data[section];
          const position = calculateTooltipPosition(section, rect, centerX, centerY, maxRadius, dimensions.length);
          
          setTooltip({
            visible: true,
            x: position.x,
            y: position.y,
            data: { ...dimData, index: section }
          });
        } else {
          setTooltip({ visible: false, x: 0, y: 0, data: null });
        }
        
        return section;
      }
      return prevHovered;
    });
  }, [type, highlightSection, data]);

  // 鼠标离开处理
  const handleMouseLeave = useCallback(() => {
    setHoveredSection(null);
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  }, []);

  // 点击处理
  const handleClick = useCallback((e) => {
    if (type !== 'COMPANY' || !onSectionClick) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const section = detectSection(x, y, centerX, centerY, maxRadius, dimensions.length);
    if (section !== null) {
      onSectionClick(section);
    }
  }, [type, onSectionClick]);

  // 计算标签位置和样式（记忆化）
  const labels = useMemo(() => {
    return dimensions.map((dim, index) => {
      const angle = (index * 2 * Math.PI) / dimensions.length - Math.PI / 2;
      const isHighlighted = type === 'TOC' && highlightSection === index;
      const scale = isHighlighted ? 1.08 : 1;
      const labelRadius = isHighlighted ? (maxRadius + 30) * 1.08 : maxRadius + 30;
      const color = isHighlighted ? '#fff' : '#9ca3af';
      
      const x = centerX + Math.cos(angle) * labelRadius;
      const y = centerY + Math.sin(angle) * labelRadius;
      
      // 计算旋转角度
      let rotationAngle = (angle * 180 / Math.PI) + 90;
      
      // 如果文字在下半部分（倒着），需要翻转 180 度
      // 下半部分的角度范围大约是 90 到 270 度（相对于正上方）
      const normalizedAngle = ((angle * 180 / Math.PI) + 90 + 360) % 360;
      if (normalizedAngle > 90 && normalizedAngle < 270) {
        rotationAngle += 180;
      }
      
      return { dim, x, y, rotationAngle, scale, color };
    });
  }, [type, highlightSection]);

  return (
    <div className="snowflake-container">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ 
          cursor: (type === 'COMPANY' || (type === 'TOC' && highlightSection === null)) ? 'pointer' : 'default' 
        }}
      />
      
      {/* 维度标签 */}
      <div className="labels">
        {labels.map(({ dim, x, y, rotationAngle, scale, color }) => (
          <div
            key={dim}
            className="label"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: `translate(-50%, -50%) rotate(${rotationAngle}deg) scale(${scale})`,
              transition: 'all 0.3s ease',
              color: color
            }}
          >
            {dim.toUpperCase()}
          </div>
        ))}
      </div>
      
      {/* 自定义 Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          key={tooltip.data.name}
          className="custom-tooltip"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`
          }}
        >
          <div className="tooltip-header">
            <span className="tooltip-number">{tooltip.data.index + 1}</span>
            <span className="tooltip-separator">l</span>
            <span className="tooltip-title">
              {tooltip.data.name.charAt(0).toUpperCase() + tooltip.data.name.slice(1)}
            </span>
          </div>
          <div className="tooltip-desc">{tooltip.data.description}</div>
          <div className="tooltip-analysis">
            <span className="analysis-label">Analysis Checks</span>
            <span className="analysis-count">
              {tooltip.data.section.filter(s => s).length}/{tooltip.data.section.length}
            </span>
          </div>
          <div className="tooltip-checks">
            {tooltip.data.section.map((active, i) => (
              <div
                key={i}
                className={`check-icon ${active ? 'check-pass' : 'check-fail'}`}
              >
                {active ? '✓' : '✕'}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SnowflakeChart;
