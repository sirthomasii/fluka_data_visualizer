import React from 'react';
import { Text } from '@mantine/core';

interface AnalyticsPage_FractalProps {
  fractalType: string | null;
}

export function AnalyticsPage_Fractal({ fractalType }: AnalyticsPage_FractalProps) {
  return (
    <div>
        <Text size="xl" fw={200}>FRACTAL ANALYTICS</Text>
        <Text>Selected Fractal: {fractalType || 'None'}</Text>
      {/* Add fractal-specific analytics here */}
    </div>
  );
}