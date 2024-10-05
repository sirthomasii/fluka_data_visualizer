import React from 'react';
import { Select } from '@mantine/core';

interface DashboardPage_FractalProps {
  fractalType: string | null;
  setFractalType: (type: string | null) => void;
}

export function DashboardPage_Fractal({ fractalType, setFractalType }: DashboardPage_FractalProps) {
  return (
    <div>
      <h3>Fractal Simulation Dashboard</h3>
      <Select
        label="Select Fractal Type"
        placeholder="Choose a fractal"
        data={[
          { value: 'mandelbulb', label: 'Mandelbulb' },
          { value: 'julia', label: 'Julia Set' },
        ]}
        value={fractalType}
        onChange={setFractalType}
      />
      {/* Add more fractal-specific controls here */}
    </div>
  );
}