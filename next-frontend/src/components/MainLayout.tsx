import React, { useState, useCallback, useEffect } from 'react';
import { Container, Flex, Box, useMantineTheme } from '@mantine/core';
import { DoubleNavbar } from './DoubleNavBar/DoubleNavbar';
import PointCloudScene from './PointCloudScene/PointCloudScene';
import Papa from 'papaparse';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const theme = useMantineTheme();
  const [thresholdValue, setThresholdValue] = useState(0);
  const [skewValue, setSkewValue] = useState(0.5);
  const [geometry, setGeometry] = useState('cube');
  const [pointsData, setPointsData] = useState<DataPoint[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleThresholdChange = useCallback((value: number) => {
    setThresholdValue(value);
  }, []);

  const handleSkewChange = useCallback((value: number) => {
    setSkewValue(value);
  }, []);

  const handleGeometryChange = useCallback((newGeometry: string) => {
    setGeometry(newGeometry);
  }, []);

  const handleDataLoaded = useCallback((data: DataPoint[]) => {
    setPointsData(data);
  }, []);

  const handleSelectedFileChange = useCallback((file: string) => {
    setSelectedFile(file);
  }, []);

  useEffect(() => {
    if (selectedFile) {
      fetch(`/fluka_data/${selectedFile}`)
        .then(response => response.text())
        .then(csvData => {
          Papa.parse(csvData, {
            complete: (result) => {
              const parsedData = result.data.map((row: any) => ({
                x: parseFloat(row[0]),
                y: parseFloat(row[1]),
                z: parseFloat(row[2]),
                value: parseFloat(row[3])
              }));
              setPointsData(parsedData);
            },
            header: false,
            skipEmptyLines: true
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
          />
        </Box>
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', paddingTop: '0' }}>
            <PointCloudScene
              thresholdValue={thresholdValue}
              skewValue={skewValue}
              geometry={geometry}
              onDataLoaded={handleDataLoaded}
              pointsData={pointsData}
            />
          </div>
          {children}
        </Box>
      </Flex>
    </Container>
  );
}