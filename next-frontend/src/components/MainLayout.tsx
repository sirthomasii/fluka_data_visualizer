import React, { useState, useCallback, useEffect } from 'react';
import { Container, Flex, Box, useMantineTheme } from '@mantine/core';
import { DoubleNavbar } from './DoubleNavBar/DoubleNavbar';
import PointCloudScene from './PointCloudScene/PointCloudScene';
import Papa from 'papaparse';

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
  const theme = useMantineTheme();
  const [thresholdValue, setThresholdValue] = useState(0);
  const [skewValue, setSkewValue] = useState(0.5);
  const [geometry, setGeometry] = useState('cube');
  const [pointsData, setPointsData] = useState<DataPoint[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);

  const handleThresholdChange = useCallback((value: number) => {
    setThresholdValue(value);
  }, []);

  const handleSkewChange = useCallback((value: number) => {
    setSkewValue(value);
  }, []);

  const handleGeometryChange = useCallback((newGeometry: string) => {
    setGeometry(newGeometry);
  }, []);

  const handleSelectedFileChange = useCallback((file: string) => {
    setSelectedFile(file);
  }, []);

  useEffect(() => {
    if (selectedFile) {
      fetch(`/fluka_data/${selectedFile}`)
        .then(response => response.text())
        .then(csvData => {
          let parsedData: DataPoint[] = [];
          let minVal = Infinity;
          let maxVal = -Infinity;

          Papa.parse(csvData, {
            step: (results) => {
              if (results.data.length === 4) {
                const point: DataPoint = {
                  x: parseFloat(results.data[0] as string),
                  y: parseFloat(results.data[1] as string),
                  z: parseFloat(results.data[2] as string),
                  value: parseFloat(results.data[3] as string)
                };
                
                if (!isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) && !isNaN(point.value)) {
                  parsedData.push(point);
                  minVal = Math.min(minVal, point.value);
                  maxVal = Math.max(maxVal, point.value);
                }
              }
            },
            complete: () => {
              setPointsData(parsedData);
              setMinValue(minVal);
              setMaxValue(maxVal);
              // Set threshold to minVal instead of 0
              setThresholdValue(minVal);
              console.log(`Loaded ${parsedData.length} points. Min: ${minVal}, Max: ${maxVal}`);
            },
            error: (error) => {
              console.error('Error parsing CSV:', error);
            }
          });
        })
        .catch(error => console.error('Error loading file:', error));
    }
  }, [selectedFile]);

  return (
    <Container 
      size="xl" 
      p={0} 
      style={{ 
        height: '100vh', 
        boxShadow: '0 0 20px 0 rgba(0, 0, 0, 1)',
        backgroundColor: theme.colors.dark[7],
      }}
    >
      <Flex style={{ height: '100%' }}>
        <Box w={300} style={{ flexShrink: 0 }}>
          <DoubleNavbar
            thresholdValue={thresholdValue}
            setThresholdValue={handleThresholdChange}
            skewValue={skewValue}
            setSkewValue={handleSkewChange}
            setGeometry={handleGeometryChange}
            pointsData={pointsData}
            setSelectedFile={handleSelectedFileChange}
            minValue={minValue}
            maxValue={maxValue}
          />
        </Box>
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', paddingTop: '0' }}>
            <PointCloudScene
              thresholdValue={thresholdValue}
              skewValue={skewValue}
              geometry={geometry}
              pointsData={pointsData}
            />
          </div>
          {children}
        </Box>
      </Flex>
    </Container>
  );
}