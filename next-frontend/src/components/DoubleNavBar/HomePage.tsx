import React from 'react';
import { Button, Group } from '@mantine/core';
import { IconMeteor, IconMathFunction } from '@tabler/icons-react';

interface HomePageProps {
  setSimulationType: (type: 'beam' | 'fractal') => void;
}

export function HomePage({ setSimulationType }: HomePageProps) {
  return (
    <div>
      <h2>Select simulation</h2>
      <Group mt="xl">
        <Button 
          leftSection={<IconMeteor size="1rem" />} 
          variant="filled"
          onClick={() => setSimulationType('beam')}
        >
          Beam simulations
        </Button>
        <Button 
          leftSection={<IconMathFunction size="1rem" />} 
          variant="filled"
          onClick={() => setSimulationType('fractal')}
        >
          Fractals
        </Button>
      </Group>
    </div>
  );
}