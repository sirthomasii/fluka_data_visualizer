import React, { useMemo } from 'react';
import { Text, Group, Stack } from '@mantine/core';
import dynamic from 'next/dynamic';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Chart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), {
  ssr: false,
});

interface DataPoint {
  x: number;
  y: number;
  z: number;
  value: number;
}

interface AnalyticsPageProps {
  pointsData: DataPoint[];
}

export function AnalyticsPage({ pointsData }: AnalyticsPageProps) {
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
    const sampleSize = Math.min(1000, pointsData.length);
    const step = Math.floor(pointsData.length / sampleSize);
    const sampledData = pointsData.filter((_, index) => index % step === 0);

    return {
      xyData: {
        labels: sampledData.map(d => d.x.toFixed(2)),
        datasets: [{
          label: 'Value',
          data: sampledData.map(d => d.value),
          fill: false,
          backgroundColor: 'rgb(75, 192, 192)',
          borderColor: 'rgba(75, 192, 192, 0.2)',
        }],
      },
      zData: {
        labels: sampledData.map(d => d.z.toFixed(2)),
        datasets: [{
          label: 'Value',
          data: sampledData.map(d => d.value),
          fill: false,
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgba(255, 99, 132, 0.2)',
        }],
      },
    };
  }, [pointsData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  if (analysisResults.numPoints === 0) {
    return <Text>No data available for analysis.</Text>;
  }

  return (
    <Stack spacing="md" style={{ width: '100%', maxWidth: '100%' }}>
      <Group>
        <Text>Number of points: {analysisResults.numPoints}</Text>
        <Text>Highest value: {analysisResults.highestValue.toFixed(2)}</Text>
        {/* <Text>Lowest value: {analysisResults.lowestValue.toFixed(2)}</Text> */}
        <Text>Average value: {analysisResults.avgValue.toFixed(2)}</Text>
      </Group>


      <Text size="lg" weight={500}>X vs Value</Text>
      <div style={{ height: '150px', width: '100%', maxWidth: '100%' }}>
        <Chart data={chartData.xyData} options={chartOptions} />
      </div>

      <Text size="lg" weight={500}>Z vs Value</Text>
      <div style={{ height: '150px', width: '100%', maxWidth: '100%' }}>
        <Chart data={chartData.zData} options={chartOptions} />
      </div>
    </Stack>
  );
}