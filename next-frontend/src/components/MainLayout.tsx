import React, { useState, useCallback, useEffect } from 'react';
import { Container, Flex, Box } from '@mantine/core';
import { DoubleNavbar } from './DoubleNavBar/DoubleNavbar';
import PointCloudScene from './PointCloudScene/PointCloudScene';
import Papa from 'papaparse';
import flukaData from '../../public/fluka_data/fluka_list.json';

interface MainLayoutProps {
  children: React.ReactNode;
}

interface DataPoint {
  x: number;
  y: number;
  z: number;
  value: number;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [thresholdValue, setThresholdValue] = useState(0);
  const [skewValue, setSkewValue] = useState(5.0); // Set initial value to 5.0
  const [pointsData, setPointsData] = useState<DataPoint[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);
  const [hideHalfPoints, setHideHalfPoints] = useState(false);
  const [beamEnergy, setBeamEnergy] = useState<string>('');
  const [beamSize, setBeamSize] = useState<string>('');
  const [material, setMaterial] = useState<string>('');
  const [simulationType, setSimulationType] = useState<'beam' | 'fractal'>('beam');
  const [fractalType, setFractalType] = useState<string | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  const handleThresholdChange = useCallback((value: number) => {
    setThresholdValue(value);
  }, []);

  const handleSkewChange = useCallback((value: number) => {
    setSkewValue(value);
  }, []);

  const handleSimulationTypeChange = useCallback((type: 'beam' | 'fractal') => {
    setSimulationType(type);
    if (type === 'fractal') {
      setFractalType('mandelbulb');
    }
  }, []);

  useEffect(() => {
    if (selectedFile) {
      console.log('Fetching file:', selectedFile);
      fetch(`/fluka_data/${selectedFile}`)
        .then(response => response.text())
        .then(csvData => {
          console.log('CSV data received, length:', csvData.length);
          const parseResult = Papa.parse<DataPoint>(csvData, {
            header: true,
            dynamicTyping: true,
            transformHeader: (header: string) => header.toLowerCase(),
          });

          console.log('Parse result:', parseResult);

          const validData = parseResult.data.filter((point): point is DataPoint => 
            typeof point.x === 'number' &&
            typeof point.y === 'number' &&
            typeof point.z === 'number' &&
            typeof point.value === 'number'
          );

          console.log('Valid data points:', validData.length);

          if (validData.length > 0) {
            let min = validData[0].value;
            let max = validData[0].value;

            for (let i = 1; i < validData.length; i++) {
              const value = validData[i].value;
              if (value < min) min = value;
              if (value > max) max = value;
            }

            setPointsData(validData);
            setMinValue(min);
            setMaxValue(max);
            setThresholdValue(min);
            console.log(`Loaded ${validData.length} points. Min: ${min}, Max: ${max}`);
          } else {
            console.error('No valid data points found');
          }
        })
        .catch(error => {
          console.error('Error loading file:', error);
          console.error('Error stack:', error.stack);
        });
    }
  }, [selectedFile]);

  useEffect(() => {
    // Only set initial values if they haven't been set before
    if (!isInitialized && flukaData.BEAM_ENERGY.length > 0 && 
        flukaData.BEAM_SIZE.length > 0 && 
        flukaData.MATERIAL.length > 0) {
      const initialBeamEnergy = flukaData.BEAM_ENERGY[0];
      const initialBeamSize = flukaData.BEAM_SIZE[0];
      const initialMaterial = flukaData.MATERIAL[0];
      
      setBeamEnergy(initialBeamEnergy);
      setBeamSize(initialBeamSize);
      setMaterial(initialMaterial);

      const initialFileKey = `${initialBeamEnergy}_${initialBeamSize}_${initialMaterial}`;
      const initialFileName = flukaData.files.find(file => file.key === initialFileKey)?.filename;
      
      if (initialFileName) {
        setSelectedFile(initialFileName);
      }

      setIsInitialized(true);
    }
  }, [isInitialized]);

  return (
    <Container 
      size="xl" 
      style={{ 
        height: '100vh', 
        padding: 0,
        boxShadow: '0 4px 10px 0 rgba(0, 0, 0, 0.8), 0 6px 20px 0 rgba(0, 0, 0, 0.8)'
      }}
    >
      <Flex style={{ height: '100%' }}>
        <Box w={300} style={{ flexShrink: 0 }}>
          <DoubleNavbar
            thresholdValue={thresholdValue}
            setThresholdValue={handleThresholdChange}
            skewValue={skewValue}
            setSkewValue={handleSkewChange}
            pointsData={pointsData}
            setSelectedFile={setSelectedFile}
            minValue={minValue}
            maxValue={maxValue}
            setHideHalfPoints={setHideHalfPoints}
            hideHalfPoints={hideHalfPoints}
            beamEnergy={beamEnergy}
            setBeamEnergy={setBeamEnergy}
            beamSize={beamSize}
            setBeamSize={setBeamSize}
            material={material}
            setMaterial={setMaterial}
            simulationType={simulationType}
            setSimulationType={handleSimulationTypeChange}
            fractalType={fractalType || "mandelbulb"}
            setFractalType={setFractalType}
          />
        </Box>
        <Box style={{ flex: 1, position: 'relative', height: '100%' }}>
          <PointCloudScene
            thresholdValue={thresholdValue}
            skewValue={skewValue}
            pointsData={pointsData}
            hideHalfPoints={hideHalfPoints}
            simulationType={simulationType}
            fractalType={fractalType as "mandelbulb" | "strangeAttractor" || "mandelbulb"}
          />
          {children}
        </Box>
      </Flex>
    </Container>
  );
}