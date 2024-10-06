import React from 'react';
import { Select, Button, Stack, Slider, Text } from '@mantine/core';

interface DashboardPage_FractalProps {
  fractalType: string | null;
  setFractalType: (type: string | null) => void;
  hideHalfPoints: boolean;
  setHideHalfPoints: (hide: boolean) => void;
  fractalParams: {
    A: number;
    B: number;
    C: number;
    n: number;
  };
  setFractalParams: React.Dispatch<React.SetStateAction<{
    A: number;
    B: number;
    C: number;
    n: number;
  }>>;
}

export function DashboardPage_Fractal({ 
  fractalType, 
  setFractalType, 
  hideHalfPoints, 
  setHideHalfPoints,
  fractalParams,
  setFractalParams
}: DashboardPage_FractalProps) {
  const handleParamChange = (param: 'A' | 'B' | 'C' | 'n') => (value: number) => {
    console.log(`DashboardPage_Fractal: Changing ${param} to ${value}`);
    setFractalParams(prev => {
      const newParams = { ...prev, [param]: value };
      console.log('DashboardPage_Fractal: New fractal params:', newParams);
      return newParams;
    });
  };

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

        <Text size="sm">Parameter A</Text>
        <Slider
          min={1}
          max={20}
          step={0.1}
          value={fractalParams.A}
          onChange={handleParamChange('A')}
          label={(value) => value.toFixed(1)}
        />

        <Text size="sm">Parameter B</Text>
        <Slider
          min={1}
          max={20}
          step={0.1}
          value={fractalParams.B}
          onChange={handleParamChange('B')}
          label={(value) => value.toFixed(1)}
        />

        <Text size="sm">Parameter C</Text>
        <Slider
          min={1}
          max={20}
          step={0.1}
          value={fractalParams.C}
          onChange={handleParamChange('C')}
          label={(value) => value.toFixed(1)}
        />

        <Text size="sm">Parameter n</Text>
        <Slider
          min={1}
          max={10}
          step={0.1}
          value={fractalParams.n}
          onChange={handleParamChange('n')}
          label={(value) => value.toFixed(1)}
        />
      </Stack>
    </div>
  );
}