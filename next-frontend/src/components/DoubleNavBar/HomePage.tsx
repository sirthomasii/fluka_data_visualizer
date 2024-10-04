import React from 'react';
import { Button, Group } from '@mantine/core';

interface HomePageProps {
  setGeometry: (geometry: string) => void;
}

export function HomePage({ setGeometry }: HomePageProps) {
  return (
    <Group>
      <Button onClick={() => setGeometry('cube')}>Cube</Button>
      <Button onClick={() => setGeometry('sphere')}>Sphere</Button>
      <Button onClick={() => setGeometry('cylinder')}>Cylinder</Button>
    </Group>
  );
}