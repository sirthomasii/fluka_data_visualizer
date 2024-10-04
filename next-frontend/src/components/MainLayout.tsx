import React, { useState, useCallback } from 'react';
import { Container, Flex, Box, useMantineTheme } from '@mantine/core';
import { DoubleNavbar } from './DoubleNavBar/DoubleNavbar';
import PointCloudScene from './PointCloudScene/PointCloudScene';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const theme = useMantineTheme();
  const [thresholdValue, setThresholdValue] = useState(0);
  const [skewValue, setSkewValue] = useState(0.5);
  const [geometry, setGeometry] = useState('cube');
  const [pointsData, setPointsData] = useState<DataPoint[]>([]);

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
          />
        </Box>
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', paddingTop: '0' }}>
            <PointCloudScene
              thresholdValue={thresholdValue}
              skewValue={skewValue}
              geometry={geometry}
              onDataLoaded={handleDataLoaded}
            />
          </div>
          {children}
        </Box>
      </Flex>
    </Container>
  );
}