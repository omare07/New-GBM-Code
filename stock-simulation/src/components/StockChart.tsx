import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CandlestickData } from '../services/simulation';

interface StockChartProps {
  ticker: string;
  candlestickData: CandlestickData[];
}

const StockChart: React.FC<StockChartProps> = ({ ticker, candlestickData }) => {
  // Calculate visible range for X-axis (show last 30 minutes of data)
  const visibleRange = useMemo(() => {
    if (candlestickData.length === 0) return { min: 0, max: 30 };
    
    // Find max X value from the data
    const sortedData = [...candlestickData].sort((a, b) => (a.x as number) - (b.x as number));
    const lastPoint = sortedData[sortedData.length - 1];
    const maxX = lastPoint.x as number;
    
    // Show exactly 30 minutes before the latest point
    const minX = Math.max(-5, maxX - 30);
    
    return {
      min: minX,
      max: maxX
    };
  }, [candlestickData]);

  // Calculate y-axis range based on visible candles with dynamic scaling
  const yAxisRange = useMemo(() => {
    // Filter candles that are visible within the current range
    const visibleCandles = candlestickData.filter(candle => {
      const x = candle.x as number;
      return x >= visibleRange.min && x <= visibleRange.max;
    });
    
    if (visibleCandles.length === 0) {
      return { min: 0, max: 100 };
    }

    // Find min/max values from visible candles
    let minVal = Number.MAX_VALUE;
    let maxVal = Number.MIN_VALUE;
    
    visibleCandles.forEach(candle => {
      const [open, high, low, close] = candle.y;
      minVal = Math.min(minVal, low);
      maxVal = Math.max(maxVal, high);
    });
    
    // Calculate the price range and add fixed percentage padding
    const priceRange = maxVal - minVal;
    
    // For very small ranges, use at least 0.5% total range to prevent flat y-axis
    if (priceRange === 0 || priceRange / ((maxVal + minVal) / 2) < 0.005) {
      const midPrice = (maxVal + minVal) / 2;
      const minRange = midPrice * 0.0025; // 0.5% total range
      return {
        min: Math.max(0, midPrice - minRange),
        max: midPrice + minRange
      };
    }
    
    // For normal movements, add smaller padding (0.5% of the price range)
    // This ensures candles don't get centered and appear to stack properly
    const paddingPercentage = 0.005; // 0.5% padding
    const midPrice = (maxVal + minVal) / 2;
    const paddingAmount = midPrice * paddingPercentage;
    
    return {
      min: Math.max(0, minVal - paddingAmount),
      max: maxVal + paddingAmount
    };
  }, [candlestickData, visibleRange]);

  const options: ApexOptions = {
    chart: {
      type: 'candlestick',
      background: '#1F2937',
      animations: {
        enabled: false,
        speed: 300,
        animateGradually: {
          enabled: false,
          delay: 50
        },
        dynamicAnimation: {
          enabled: false,
          speed: 350
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      },
      // Ensure proper positioning of elements
      parentHeightOffset: 0,
      sparkline: {
        enabled: false
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#10B981',
          downward: '#EF4444'
        },
        wick: {
          useFillColor: true
        }
      }
    },
    title: {
      text: ticker,
      align: 'left',
      style: {
        color: '#F3F4F6'
      }
    },
    stroke: {
      width: 1.5 // Slightly thicker lines for better visibility
    },
    xaxis: {
      type: 'numeric',
      tickAmount: 6,
      labels: {
        formatter: function(value: string) {
          // Convert to integer to avoid decimal minutes
          return `${parseInt(value)} min`;
        },
        style: {
          colors: '#9CA3AF'
        }
      },
      axisBorder: {
        show: true,
        color: '#374151'
      },
      axisTicks: {
        show: true,
        color: '#374151'
      },
      min: visibleRange.min,
      max: visibleRange.max,
      range: 30, // Explicit range for better control
      crosshairs: {
        show: true,
        position: 'back',
        stroke: {
          color: '#9CA3AF',
          width: 1,
          dashArray: 2
        }
      },
      // Ensure proper tick placement for clearer labels
      tickPlacement: 'on'
    },
    yaxis: {
      min: yAxisRange.min,
      max: yAxisRange.max,
      labels: {
        formatter: function(value: number) {
          return `$${value.toFixed(2)}`;
        },
        style: {
          colors: '#9CA3AF'
        }
      },
      tickAmount: 8,
      forceNiceScale: false,
      decimalsInFloat: 2,
      opposite: false, // Keep Y-axis on the left side
      crosshairs: {
        show: true,
        position: 'back',
        stroke: {
          color: '#9CA3AF',
          width: 1,
          dashArray: 2
        }
      },
      // Prevent auto-scaling that might center the candles
      floating: false,
      axisTicks: {
        show: true
      },
      axisBorder: {
        show: true,
        color: '#374151'
      }
    },
    grid: {
      borderColor: '#374151',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        right: 10,
        left: 10
      }
    },
    tooltip: {
      theme: 'dark',
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
        const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
        const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
        const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
        const x = w.globals.labels[dataPointIndex];
        
        return `
          <div class="apexcharts-tooltip-candlestick bg-gray-900 p-2 rounded-md">
            <div class="text-white">Minute: ${x}</div>
            <div class="text-white">Open: <span class="${o <= c ? 'text-green-500' : 'text-red-500'}">$${o.toFixed(2)}</span></div>
            <div class="text-green-500">High: $${h.toFixed(2)}</div>
            <div class="text-red-500">Low: $${l.toFixed(2)}</div>
            <div class="text-white">Close: <span class="${c >= o ? 'text-green-500' : 'text-red-500'}">$${c.toFixed(2)}</span></div>
          </div>
        `;
      },
      fixed: {
        enabled: false,
        position: 'topRight',
      },
      marker: {
        show: false
      }
    },
    responsive: [
      {
        breakpoint: 1000,
        options: {
          chart: {
            height: '100%'
          }
        }
      }
    ],
    annotations: {
      yaxis: [{
        y: candlestickData.length > 0 ? 
          candlestickData[candlestickData.length - 1].y[3] : 0, // Current price line
        borderColor: '#FFFFFF',
        borderWidth: 1,
        strokeDashArray: 2,
        label: {
          text: 'Current',
          position: 'left',
          style: {
            color: '#FFFFFF',
            background: '#374151'
          }
        }
      }]
    }
  };

  // Format the data for candlestick chart to ensure no duplicate x values
  const sortedSeries = useMemo(() => {
    // First sort by x value
    const sorted = [...candlestickData]
      .sort((a, b) => (a.x as number) - (b.x as number));
    
    // Filter out any duplicates that might cause rendering issues
    const uniqueData: CandlestickData[] = [];
    const seen = new Set<number>();
    
    sorted.forEach(item => {
      const x = item.x as number;
      if (!seen.has(x)) {
        seen.add(x);
        uniqueData.push(item);
      }
    });
    
    // Format the data to ensure each candle builds on the previous one
    return [{
      name: ticker,
      data: uniqueData.map(item => {
        // Ensure we're using exact decimal values, not rounded ones
        // This prevents "bouncing" candles due to rounding errors
        return {
          x: item.x,
          y: [
            Number(parseFloat(item.y[0].toString()).toFixed(2)), // Open
            Number(parseFloat(item.y[1].toString()).toFixed(2)), // High
            Number(parseFloat(item.y[2].toString()).toFixed(2)), // Low
            Number(parseFloat(item.y[3].toString()).toFixed(2))  // Close
          ]
        };
      })
    }];
  }, [candlestickData, ticker]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg" style={{ height: '100%' }}>
      <div style={{ height: 'calc(100% - 20px)' }}>
        <ReactApexChart 
          options={options} 
          series={sortedSeries} 
          type="candlestick" 
          height="100%" 
          width="100%"
        />
      </div>
    </div>
  );
};

export default StockChart; 