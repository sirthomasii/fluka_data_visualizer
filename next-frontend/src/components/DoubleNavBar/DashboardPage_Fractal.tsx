import React from 'react';
import { Select, Button, Stack, Slider, Text } from '@mantine/core';

interface DashboardPage_FractalProps {
  fractalType: string | null;
  setFractalType: (type: string | null) => void;

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
  setShowBoundingBox: (show: boolean) => void;
  showBoundingBox: boolean;
}

export function DashboardPage_Fractal({ 
  fractalType, 
  setFractalType, 
  fractalParams,
  setFractalParams,
  setShowBoundingBox,
  showBoundingBox
}: DashboardPage_FractalProps) {
  const handleParamChange = (param: 'A' | 'B' | 'C' | 'n') => (value: number) => {
    console.log(`DashboardPage_Fractal: Changing ${param} to ${value}`);
    setFractalParams(prev => {
      const newParams = { ...prev, [param]: value };
      console.log('DashboardPage_Fractal: New fractal params:', newParams);
      return newParams;
    });
  };

  const getSliderProps = (param: 'A' | 'B' | 'C' | 'n') => {
    if (fractalType === 'strangeAttractor') {
      switch (param) {
        case 'A': return { min: 0, max: 1, step: 0.1 };
        case 'B': return { min: 0, max: 60, step: 0.1 };
        case 'C': return { min: 0, max: 10, step: 0.1 };
        case 'n': return { min: 0, max: 10, step: 0.1 };
      }
    } else { // mandelbulb
      return { 
        min: 1, 
        max: param === 'n' ? 10 : 20, 
        step: 0.1
      };
    }
  };

  return (
    <div>
        <Text size="xl" fw={200}>FRACTAL PARAMETERS</Text>
        <Stack gap="md" style={{ maxWidth: 400, margin: '20px 0' }}>
        <Select
          label="Select Fractal Type"
          placeholder="Choose a fractal"
          data={[
            { value: 'mandelbulb', label: 'Mandelbulb' },
            { value: 'strangeAttractor', label: 'Strange Attractor' },
          ]}
          value={fractalType}
          onChange={(value) => {
            setFractalType(value);
            // Hide grid and bounding box when changing fractal type
            setShowBoundingBox(false);
            // Set new default values when selecting Strange Attractor
            if (value === 'strangeAttractor') {
              setFractalParams({
                A: 1,
                B: 22,
                C: 4,
                n: 1
              });
            } else if (value === 'mandelbulb') {
              // For mandelbulb, we can set its own default values
              setFractalParams({
                A: 18,
                B: 15,
                C: 5,
                n: 4
              });
            }
          }}
        />

        

        {['A', 'B', 'C', 'n'].map((param) => (
          <React.Fragment key={param}>
            <Text size="sm">Parameter {param}</Text>
            <Slider
              {...getSliderProps(param as 'A' | 'B' | 'C' | 'n')}
              value={fractalParams[param as 'A' | 'B' | 'C' | 'n']}
              onChange={handleParamChange(param as 'A' | 'B' | 'C' | 'n')}
              label={(value) => value.toFixed(1)}
            />
          </React.Fragment>
        ))}
        <Button 
          onClick={() => setShowBoundingBox(!showBoundingBox)}
          variant={showBoundingBox ? "outline" : "filled"}
          color="purple"
        >
          {showBoundingBox ? "Hide Bounding Box" : "Show Bounding Box"}
        </Button>

      </Stack>
    </div>
  );
}