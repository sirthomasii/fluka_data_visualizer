import React from 'react';
import { Title, Slider, Stack, Select, Text } from '@mantine/core';
import classes from './DoubleNavbar.module.css';

interface DashboardPageProps {
  thresholdValue: number;
  setThresholdValue: (value: number) => void;
  skewValue: number;
  setSkewValue: (value: number) => void;
  simulation: string;
  setSimulation: (value: string) => void;
  material: string;
  setMaterial: (value: string) => void;
  energy: number;
  setEnergy: (value: number) => void;
  beamSize: number;
  setBeamSize: (value: number) => void;
}

export function DashboardPage({ 
  thresholdValue, setThresholdValue,
  skewValue, setSkewValue,
  simulation, setSimulation,
  material, setMaterial,
  energy, setEnergy,
  beamSize, setBeamSize
}: DashboardPageProps) {
  // console.log('HomePage rendered with:', { thresholdValue, skewValue });

  const handleThresholdChange = (value: number) => {
    // console.log('HomePage: Threshold slider changed:', value);
    if (typeof setThresholdValue === 'function') {
      setThresholdValue(value);
    } else {
      console.error('setThresholdValue is not a function:', setThresholdValue);
    }
  };

  const handleSkewChange = (value: number) => {
    // console.log('HomePage: Skew slider changed:', value);
    if (typeof setSkewValue === 'function') {
      setSkewValue(value);
    } else {
      console.error('setSkewValue is not a function:', setSkewValue);
    }
  };

  return (
    <div>
      <Stack spacing="md" style={{ maxWidth: 400, margin: '20px 0' }}>
        <Select
          label="Simulation"
          value={simulation}
          onChange={(value) => setSimulation(value as string)}
          data={[
            { value: 'energy', label: 'Energy' },
            { value: 'particles', label: 'Particles' },
          ]}
        />
        <Select
          label="Material"
          value={material}
          onChange={(value) => setMaterial(value as string)}
          data={[
            { value: 'copper', label: 'Copper' },
            { value: 'aluminum', label: 'Aluminum' },
          ]}
        />
        <Text size="sm">Energy (MeV)</Text>
        <Slider
          min={1}
          max={10}
          step={1}
          value={energy}
          onChange={setEnergy}
          marks={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
            { value: 6, label: '6' },
            { value: 7, label: '7' },
            { value: 8, label: '8' },
            { value: 9, label: '9' },
            { value: 10, label: '10' },
          ]}
        />
        <Text size="sm">Beam Size (cm)</Text>
        <Slider
          min={1}
          max={5}
          step={1}
          value={beamSize}
          onChange={setBeamSize}
          marks={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
            { value: 4, label: '4' },
            { value: 5, label: '5' },
          ]}
        />
        <Text size="sm">Lowest Visible Value</Text>
        <Slider
          min={0}
          max={100}
          value={thresholdValue}
          onChange={handleThresholdChange}
          onChangeEnd={(value) => console.log('Threshold slider change ended:', value)}
        />
        <Text size="sm">Color Gradient Skew</Text>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={skewValue}
          onChange={handleSkewChange}
          onChangeEnd={(value) => console.log('Skew slider change ended:', value)}
        />
      </Stack>
    </div>
  );
}