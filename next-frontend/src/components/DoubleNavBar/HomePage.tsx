import React from 'react';
import { Button, Group } from '@mantine/core';
import { IconMeteor, IconMathFunction } from '@tabler/icons-react';

export function HomePage() {
  return (
    <div>
      <h3>ytor physics simulator</h3>
      <Group mt="xl">
        <Button leftSection={<IconMeteor size="1rem" />} variant="filled">
          Beam simulations
        </Button>
        <Button leftSection={<IconMathFunction size="1rem" />} variant="filled">
          Fractals
        </Button>
      </Group>
    </div>
  );
}