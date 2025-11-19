import { useState } from 'react';
import SnowflakeChart from './components/SnowflakeChart';
import './App.css';

const initialData = [
  {
    name: "value",
    value: 3,
    description: "Does the company pay a good, reliable and sustainable dividend?",
    section: [true, true, false, false, false, false]
  },
  {
    name: "future",
    value: 7,
    description: "How is the company forecast to perform in the next 1-3 years?",
    section: [true, true, true, true, true, true]
  },
  {
    name: "past",
    value: 5,
    description: "Does the company have strong financial health and manageable debt?",
    section: [false, true, true, true, false, true]
  },
  {
    name: "health",
    value: 7,
    description: "How has the company performed over the past 5 years?",
    section: [true, true, true, true, true, true]
  },
  {
    name: "dividend",
    value: 1,
    description: "Is the company undervalued compared to its peers, industry and forecasted cash flows?",
    section: [false, false, false, false, false, false]
  }
];

function App() {
  // 使用函数式初始化，确保初始数据是深拷贝
  const [data, setData] = useState(() => JSON.parse(JSON.stringify(initialData)));
  const [highlightSection, setHighlightSection] = useState(null);
  const [chartType, setChartType] = useState('COMPANY');

  const handleScoreChange = (index, value) => {
    const newData = [...data];
    newData[index].value = value;
    setData(newData);
  };

  const handleHighlightChange = (section) => {
    if (section === null) {
      setHighlightSection(null);
      setChartType('COMPANY');
    } else {
      setHighlightSection(section);
      setChartType('TOC');
    }
  };

  const handleReset = () => {
    // 重置为原始初始数据的深拷贝
    setData(JSON.parse(JSON.stringify(initialData)));
    setHighlightSection(null);
    setChartType('COMPANY');
  };

  const handleSectionClick = (index) => {
    alert(`点击了维度索引: ${index} (${data[index].name})`);
  };

  return (
    <div className="app">
      <div className="content">
        <div className="controls">
          <div className="control-panel">
            <h3>📊 调整维度分数</h3>
            {data.map((item, index) => {
              const percentage = (item.value / 7) * 100;
              return (
                <div key={item.name} className="slider-group">
                  <div className='slider-bet'>
                    <label className="slider-label">{item.name.toUpperCase()}</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        min="0"
                        max="7"
                        value={item.value}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          handleScoreChange(index, Math.min(7, Math.max(0, val)));
                        }}
                        className="slider-input"
                      />
                      <div className="input-buttons">
                        <button
                          className={`input-btn input-btn-up ${item.value >= 7 ? 'disabled' : ''}`}
                          onClick={() => item.value < 7 && handleScoreChange(index, item.value + 1)}
                          disabled={item.value >= 7}
                        >
                          ▲
                        </button>
                        <button
                          className={`input-btn input-btn-down ${item.value <= 0 ? 'disabled' : ''}`}
                          onClick={() => item.value > 0 && handleScoreChange(index, item.value - 1)}
                          disabled={item.value <= 0}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="slider-controls">
                    <div className="slider-wrapper">
                      <input
                        type="range"
                        min="0"
                        max="7"
                        value={item.value}
                        onChange={(e) => handleScoreChange(index, parseInt(e.target.value))}
                        className="slider-range"
                        style={{
                          background: `linear-gradient(to right, #8b5cf6 0%, #a78bfa ${percentage}%, #475569 ${percentage}%, #475569 100%)`
                        }}
                      />
                    </div>
                
                  </div>
                </div>
              );
            })}
          </div>

          <div className="control-panel">
            <h3>🎯 选择高亮区域</h3>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="highlight"
                  checked={highlightSection === null}
                  onChange={() => handleHighlightChange(null)}
                />
                NONE
              </label>
              {data.map((item, index) => (
                <label key={item.name}>
                  <input
                    type="radio"
                    name="highlight"
                    checked={highlightSection === index}
                    onChange={() => handleHighlightChange(index)}
                  />
                  {item.name.toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <button className="reset-btn" onClick={handleReset}>
            🔄 重置所有设置
          </button>
        </div>

        <div className="chart-wrapper">
          <SnowflakeChart
            data={data}
            type={chartType}
            highlightSection={highlightSection}
            onSectionClick={handleSectionClick}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
