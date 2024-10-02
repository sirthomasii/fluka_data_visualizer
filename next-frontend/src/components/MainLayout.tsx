import React, { useState, useCallback } from 'react';
import { Container, Flex, Box } from '@mantine/core';
import { DoubleNavbar } from './DoubleNavBar/DoubleNavbar';
import PointCloudScene from './PointCloudScene/PointCloudScene';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [thresholdValue, setThresholdValue] = useState(0);
  const [skewValue, setSkewValue] = useState(0.5);

  const handleThresholdChange = useCallback((value: number) => {
    setThresholdValue(value);
  }, []);

  const handleSkewChange = useCallback((value: number) => {
    setSkewValue(value);
  }, []);

  return (
    <Container size="xl" p={0} style={{ height: '100vh' }}>
      <Flex style={{ height: '100%' }}>
        <Box w={300} style={{ flexShrink: 0 }}>
          <DoubleNavbar
            thresholdValue={thresholdValue}
            setThresholdValue={handleThresholdChange}
            skewValue={skewValue}
            setSkewValue={handleSkewChange}
          />
        </Box>
        <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
            <PointCloudScene
              thresholdValue={thresholdValue}
              skewValue={skewValue}
            />
          </div>
          {children}
        </Box>
      </Flex>
    </Container>
  );
}