import React, { useEffect, useState } from 'react';
import { Slider, Stack, Select, Text, Button } from '@mantine/core';
import flukaData from '../../../public/fluka_data/fluka_list.json';

interface DashboardPageProps {
  thresholdValue: number;
  setThresholdValue: (value: number) => void;
  skewValue: number;
  setSkewValue: (value: number) => void;
  setSelectedFile: (file: string) => void;
  minValue: number;
  maxValue: number;
  beamEnergy: string;
  setBeamEnergy: (value: string) => void;
  beamSize: string;
  setBeamSize: (value: string) => void;
  material: string;
  setMaterial: (value: string) => void;
  setHideHalfPoints: (hide: boolean) => void;
  hideHalfPoints: boolean;
  showBoundingBox: boolean;
  setShowBoundingBox: (show: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

interface FlukaParams {
  BEAM_ENERGY: string[];
  BEAM_SIZE: string[];
  MATERIAL: string[];
  files: { [key: string]: string };
}

export function DashboardPage_Beam({ 
  thresholdValue, setThresholdValue,
  skewValue, setSkewValue,
  setSelectedFile,
  minValue, maxValue,
  beamEnergy, setBeamEnergy,
  beamSize, setBeamSize,
  material, setMaterial,
  setHideHalfPoints,
  hideHalfPoints,
  showBoundingBox,
  setShowBoundingBox,
  showGrid,
  setShowGrid
}: DashboardPageProps) {
  const [flukaParams, setFlukaParams] = useState<FlukaParams | null>(null);

  useEffect(() => {
    const transformedFiles = Object.fromEntries(
      flukaData.files.map(file => [file.key, file.filename])
    );
    setFlukaParams({ ...flukaData, files: transformedFiles });

    // Only set default values if they're not already set
    if (!beamEnergy && flukaData.BEAM_ENERGY.length > 0) setBeamEnergy(flukaData.BEAM_ENERGY[0]);
    if (!beamSize && flukaData.BEAM_SIZE.length > 0) setBeamSize(flukaData.BEAM_SIZE[0]);
    if (!material && flukaData.MATERIAL.length > 0) setMaterial(flukaData.MATERIAL[0]);
    
    // Only set default skew value if it's not already set
    if (skewValue === 0) setSkewValue(5.0);
  }, [beamEnergy, beamSize, material, skewValue]);

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
    if (!isNaN(value) && isFinite(value)) {
      console.log('Threshold value changed:', value);
      // Ensure the value is within the valid range
      const clampedValue = Math.max(minValue, Math.min(maxValue, value));
      setThresholdValue(clampedValue);
    } else {
      console.error('Invalid threshold value:', value);
      // Set to minValue if an invalid value is received
      setThresholdValue(minValue);
    }
  };

  const handleSkewChange = (value: number) => {
    if (!isNaN(value) && isFinite(value)) {
      console.log('Skew value changed:', value);
      setSkewValue(value);
    } else {
      console.error('Invalid skew value:', value);
      // Set to default value (e.g., 1) if an invalid value is received
      setSkewValue(1);
    }
  };

  // Log current values for debugging
  useEffect(() => {
    console.log(`DashboardPage - Current values: Threshold: ${thresholdValue}, Min: ${minValue}, Max: ${maxValue}, Skew: ${skewValue}`);
  }, [thresholdValue, minValue, maxValue, skewValue]);

  return (
    <div>
      <h3>Proton beam params</h3>

      <Stack gap="md" style={{ maxWidth: 400, margin: '20px 0' }}>
        {flukaParams && (
          <>
            <Select
              label="Beam Energy (GeV)"
              value={beamEnergy}
              onChange={(value) => setBeamEnergy(value as string)}
              data={flukaParams.BEAM_ENERGY?.map(energy => ({ value: energy, label: `${energy} GeV` })) || []}
            />
            <Select
              label="Beam Size (cm)"
              value={beamSize}
              onChange={(value) => setBeamSize(value as string)}
              data={flukaParams.BEAM_SIZE?.map(size => ({ value: size, label: `${size} cm` })) || []}
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
          min={minValue}
          max={Math.min(1e+5, maxValue)} // Set max to 1e+5 or maxValue, whichever is smaller
          value={thresholdValue}
          onChange={handleThresholdChange}
          onChangeEnd={(value) => console.log('Threshold slider change ended:', value)}
          step={(Math.min(1e+5, maxValue) - minValue) / 1000}
          labelAlwaysOn
          label={(value) => value.toExponential(2)}
        />
        <Text size="sm">Color Gradient Skew</Text>
        <Slider
          min={0.1}
          max={10}
          step={0.1}
          value={skewValue}
          onChange={handleSkewChange}
          onChangeEnd={(value) => console.log('Skew slider change ended:', value)}
          labelAlwaysOn
        />
        <Button 
          onClick={() => setHideHalfPoints(!hideHalfPoints)}
          variant={hideHalfPoints ? "outline" : "filled"}
          color="purple" // Change the button color to blue
        >
          {hideHalfPoints ? "Show All Points" : "Hide Half Points"}
        </Button>
        <Button 
          onClick={() => setShowBoundingBox(!showBoundingBox)}
          variant={showBoundingBox ? "filled" : "outline"}
          color="purple"
        >
          {showBoundingBox ? "Hide Bounding Box" : "Show Bounding Box"}
        </Button>
        <Button 
          onClick={() => setShowGrid(!showGrid)}
          variant={showGrid ? "filled" : "outline"}
          color="purple"
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </Button>
      </Stack>
    </div>
  );
}