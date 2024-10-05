import React, { useMemo } from 'react';
import { Text, Group, Stack } from '@mantine/core';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartOptions
} from 'chart.js';
import dynamic from 'next/dynamic';

const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
});

import { ScriptableLineSegmentContext } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DataPoint {
  x: number;
  y: number;
  z: number;
  value: number;
}

// Remove unused AnalyticsPageProps interface

export function AnalyticsPage_Beam({ pointsData }: { pointsData: DataPoint[] }) {
  const analysisResults = useMemo(() => {
    const numPoints = pointsData.length;
    let highestValue = -Infinity;
    let lowestValue = Infinity;
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let sumValue = 0;

    for (let i = 0; i < numPoints; i++) {
      const point = pointsData[i];
      if (point.value > highestValue) highestValue = point.value;
      if (point.value < lowestValue) lowestValue = point.value;
      sumX += point.x;
      sumY += point.y;
      sumZ += point.z;
      sumValue += point.value;
    }

    const avgX = sumX / numPoints;
    const avgY = sumY / numPoints;
    const avgZ = sumZ / numPoints;
    const avgValue = sumValue / numPoints;

    return { numPoints, highestValue, lowestValue, avgX, avgY, avgZ, avgValue };
  }, [pointsData]);

  const chartData = useMemo(() => {
    const createRandomSample = (data: DataPoint[], axis: 'x' | 'y' | 'z', sampleSize: number) => {
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      const sample = shuffled.slice(0, sampleSize);
      const lines: { x: number; y: number }[] = [];

      sample.forEach(point => {
        lines.push({ x: point[axis], y: 0 });
        lines.push({ x: point[axis], y: point.value });
        lines.push({ x: point[axis], y: NaN }); // NaN creates a break in the line
      });

      return lines;
    };

    const sampleSize = Math.min(100, pointsData.length);

    return {
      yyData: {
        datasets: [{
          label: 'Y vs Value',
          data: createRandomSample(pointsData, 'y', sampleSize),
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 0.5,
          fill: false,
          pointRadius: 0,
          segment: {
            borderColor: (ctx: ScriptableLineSegmentContext) => 
              ctx.p1.parsed.y > 0 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(0,0,0,0)',
          }
        }],
      },
      zzData: {
        datasets: [{
          label: 'Z vs Value',
          data: createRandomSample(pointsData, 'z', sampleSize),
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 0.5,
          fill: false,
          pointRadius: 0,
          segment: {
            borderColor: (ctx: ScriptableLineSegmentContext) => 
              ctx.p1.parsed.y > 0 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(0,0,0,0)',
          }
        }],
      },
    };
  }, [pointsData]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Position'
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 15
        }
      },
      y: {
        title: {
          display: true,
          text: 'Value'
        },
        position: 'left' as const,
        beginAtZero: true
      }
    },
    layout: {
      padding: {
        left: 0,
        right: 0,
        top: 10,
        bottom: 0
      }
    }
  };

  if (analysisResults.numPoints === 0) {
    return <Text>No data available for analysis.</Text>;
  }

  return (
    <Stack gap="md" style={{ width: '100%', maxWidth: '100%' }}>
      <Group>
        <Text>Number of points: {analysisResults.numPoints}</Text>
        <Text>Highest value: {analysisResults.highestValue.toFixed(2)}</Text>
        <Text>Average value: {analysisResults.avgValue.toFixed(2)}</Text>
      </Group>

      <Text size="lg" fw={500}>Y vs Value (Random Sample)</Text>
      <div style={{ height: '150px', width: '100%', maxWidth: '100%', position: 'relative' }}>
        <Line data={chartData.yyData} options={chartOptions} />
      </div>

      <Text size="lg" fw={500}>Z vs Value (Random Sample)</Text>
      <div style={{ height: '150px', width: '100%', maxWidth: '100%', position: 'relative' }}>
        <Line data={chartData.zzData} options={chartOptions} />
      </div>

      <style jsx global>{`
        canvas {
          left: 0 !important;
        }
      `}</style>
    </Stack>
  );
}