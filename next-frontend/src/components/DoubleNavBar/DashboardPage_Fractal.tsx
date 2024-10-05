import React from 'react';
import { Select, Button, Stack } from '@mantine/core';

interface DashboardPage_FractalProps {
  fractalType: string | null;
  setFractalType: (type: string | null) => void;
  hideHalfPoints: boolean;
  setHideHalfPoints: (hide: boolean) => void;
}

export function DashboardPage_Fractal({ 
  fractalType, 
  setFractalType, 
  hideHalfPoints, 
  setHideHalfPoints 
}: DashboardPage_FractalProps) {
  return (
    <div>
      <h3>Fractal params</h3>
      <Stack gap="md" style={{ maxWidth: 400, margin: '20px 0' }}>
        <Select
          label="Select Fractal Type"
          placeholder="Choose a fractal"
          data={[
            { value: 'mandelbulb', label: 'Mandelbulb' },
            { value: 'strangeAttractor', label: 'Strange Attractor' },
          ]}
          value={fractalType}
          onChange={setFractalType}
        />
        <Button 
          onClick={() => setHideHalfPoints(!hideHalfPoints)}
          variant={hideHalfPoints ? "outline" : "filled"}
          color="purple"
        >
          {hideHalfPoints ? "Show All Points" : "Hide Half Points"}
        </Button>
      </Stack>
      {/* Add more fractal-specific controls here */}
    </div>
  );
}