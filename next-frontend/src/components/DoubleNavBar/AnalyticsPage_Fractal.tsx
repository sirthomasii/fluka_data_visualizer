import React from 'react';
import { Text } from '@mantine/core';

interface AnalyticsPage_FractalProps {
  fractalType: string | null;
}

export function AnalyticsPage_Fractal({ fractalType }: AnalyticsPage_FractalProps) {
  return (
    <div>
      <h3>Fractal Simulation Analytics</h3>
      <Text>Selected Fractal: {fractalType || 'None'}</Text>
      {/* Add fractal-specific analytics here */}
    </div>
  );
}