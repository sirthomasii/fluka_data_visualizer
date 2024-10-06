import React from 'react';
import { Button, Group, Flex, Text } from '@mantine/core';
import { IconMeteor, IconMathFunction, IconAtom } from '@tabler/icons-react';

interface HomePageProps {
  setSimulationType: (type: 'beam' | 'fractal') => void;
  setShowGrid: (show: boolean) => void;
  setShowBoundingBox: (show: boolean) => void;
}

export function HomePage({ setSimulationType, setShowGrid, setShowBoundingBox }: HomePageProps) {
  const handleSimulationTypeChange = (type: 'beam' | 'fractal') => {
    setSimulationType(type);
    if (type === 'fractal') {
      setShowBoundingBox(true);
    } else {
      // For beam simulation, we'll set them back to true
      setShowGrid(true);
      setShowBoundingBox(true);
    }
  };

  return (
    <Flex direction="column" align="center" style={{ height: '100%' }}>
      <Flex align="center" gap="sm">
        <IconAtom size="2rem" />
        <Text size="xl" fw={200}>SELECT SIMULATION</Text>
      </Flex>
      <Group mt="xl" pl="xs">
        <Button 
          leftSection={<IconMeteor size="1rem" />} 
          variant="filled"
          color="purple"
          onClick={() => handleSimulationTypeChange('beam')}
        >
          Proton Beam
        </Button>
        <Button 
          leftSection={<IconMathFunction size="1rem" />} 
          variant="filled"
          color="purple"
          onClick={() => handleSimulationTypeChange('fractal')}
        >
          Fractals
        </Button>
      </Group>
    </Flex>
  );
}