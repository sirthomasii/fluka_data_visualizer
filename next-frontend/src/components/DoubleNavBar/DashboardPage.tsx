import React, { useEffect, useState } from 'react';
import { Title, Slider, Stack, Select, Text } from '@mantine/core';
import classes from './DoubleNavbar.module.css';

interface DashboardPageProps {
  thresholdValue: number;
  setThresholdValue: (value: number) => void;
  skewValue: number;
  setSkewValue: (value: number) => void;
  setSelectedFile: (file: string) => void;
}

interface FlukaParams {
  BEAM_ENERGY: string[];
  BEAM_SIZE: string[];
  MATERIAL: string[];
  files: { [key: string]: string };
}

export function DashboardPage({ 
  thresholdValue, setThresholdValue,
  skewValue, setSkewValue,
  setSelectedFile
}: DashboardPageProps) {
  const [flukaParams, setFlukaParams] = useState<FlukaParams | null>(null);
  const [beamEnergy, setBeamEnergy] = useState<string>('');
  const [beamSize, setBeamSize] = useState<string>('');
  const [material, setMaterial] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:5000/api/get_fluka_files')
      .then(response => response.json())
      .then(data => setFlukaParams(data));
  }, []);

  useEffect(() => {
    if (flukaParams && beamEnergy && beamSize && material) {
      const fileKey = `${beamEnergy}_${beamSize}_${material}`;
      const selectedFileName = flukaParams.files[fileKey];
      if (selectedFileName) {
        setSelectedFile(selectedFileName);
      }
    }
  }, [flukaParams, beamEnergy, beamSize, material, setSelectedFile]);

  const handleThresholdChange = (value: number) => {
    console.log('Threshold value changed:', value);
    setThresholdValue(value);
  };

  const handleSkewChange = (value: number) => {
    console.log('Skew value changed:', value);
    setSkewValue(value);
  };

  return (
    <div>
      <Stack spacing="md" style={{ maxWidth: 400, margin: '20px 0' }}>
        {flukaParams && (
          <>
            <Select
              label="Beam Energy"
              value={beamEnergy}
              onChange={(value) => setBeamEnergy(value as string)}
              data={flukaParams.BEAM_ENERGY?.map(energy => ({ value: energy, label: energy })) || []}
            />
            <Select
              label="Beam Size"
              value={beamSize}
              onChange={(value) => setBeamSize(value as string)}
              data={flukaParams.BEAM_SIZE?.map(size => ({ value: size, label: size })) || []}
            />
            <Select
              label="Material"
              value={material}
              onChange={(value) => setMaterial(value as string)}
              data={flukaParams.MATERIAL?.map(mat => ({ value: mat, label: mat })) || []}
            />
          </>
        )}
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