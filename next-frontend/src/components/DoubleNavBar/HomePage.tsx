import React from 'react';
import { Button, Group, Flex, Text } from '@mantine/core';
import { IconMeteor, IconMathFunction, IconAtom } from '@tabler/icons-react';

interface HomePageProps {
  setSimulationType: (type: 'beam' | 'fractal') => void;
}

export function HomePage({ setSimulationType }: HomePageProps) {
  return (
    <div>
      <Flex align="center" gap="sm">
        <IconAtom size="2rem" />
        <Text size="xl" fw={700}>Select simulation</Text>
      </Flex>
      <Group mt="xl">
        <Button 
          leftSection={<IconMeteor size="1rem" />} 
          variant="filled"
          color="purple"
          onClick={() => setSimulationType('beam')}
        >
          Proton Beam
        </Button>
        <Button 
          leftSection={<IconMathFunction size="1rem" />} 
          variant="filled"
          color="purple"
          onClick={() => setSimulationType('fractal')}
        >
          Fractals
        </Button>
      </Group>
    </div>
  );
}