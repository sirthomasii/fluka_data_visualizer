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
  LogarithmicScale,
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
  LogarithmicScale,  // Add this line
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
        lines.push({ x: point[axis], y: point.value });  // Keep this as 'value'
        lines.push({ x: point[axis], y: NaN }); // NaN creates a break in the line
      });

      return lines;
    };

    const sampleSize = Math.min(150, pointsData.length);

    return {
      yyData: {
        datasets: [{
          label: 'Y vs Var',  // Change this label
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
          label: 'X vs Var',  // Change this label
          data: createRandomSample(pointsData, 'x', sampleSize),
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 0.5,
          fill: false,
          pointRadius: 0,
          segment: {
            borderColor: (ctx: ScriptableLineSegmentContext) => 
              ctx.p1.parsed.y > 0 ? 'rgba(192, 72, 192, 0.5)' : 'rgba(0,0,0,0)',
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
        min: -1.0, // Adjust this value based on your data range
        max: 1.0, // Adjust this value based on your data range

        ticks: {
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 15
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: ''
        },
        position: 'left' as const,
        min: 0.1, // Adjust this value based on your data range
        ticks: {
          callback: function(value) {
            return Number(value.toString()).toExponential();
          }
        }
      }
    },
    layout: {
      padding: 0
    }
  };

  if (analysisResults.numPoints === 0) {
    return <Text>No data available for analysis.</Text>;
  }

  return (
    <Stack gap="xs" style={{ width: '100%', height: '100%', overflow: 'auto' }}>
        <Text size="xl" fw={200}>BEAM ANALYTICS</Text>

      <Group>
      <Text size="xs">Units: GeV / (pp) / cm³.</Text>
        <Text size="xs">Points: {analysisResults.numPoints}</Text>
        <Text size="xs">Highest: {analysisResults.highestValue.toExponential(2)}</Text>
        <Text size="xs">Average: {analysisResults.avgValue.toExponential(2)}</Text>
      </Group>

      <Text size="sm" fw={500}>Y Binning </Text>
      <div style={{ height: '200px', width: '250px', position: 'relative' }}>
        <Line data={chartData.yyData} options={chartOptions} />
      </div>

      <Text size="sm" fw={500}>X Binning </Text>
      <div style={{ height: '200px', width: '250px', position: 'relative' }}>
        <Line data={chartData.zzData} options={chartOptions} />
      </div>

    </Stack>
  );
}