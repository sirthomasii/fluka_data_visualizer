import React from 'react';
import { Title, Slider, Stack } from '@mantine/core';
import classes from './DoubleNavbar.module.css';

interface HomePageProps {
  thresholdValue: number;
  setThresholdValue: (value: number) => void;
  skewValue: number;
  setSkewValue: (value: number) => void;
}

export function HomePage({ thresholdValue, setThresholdValue, skewValue, setSkewValue }: HomePageProps) {
  // console.log('HomePage rendered with:', { thresholdValue, skewValue });

  const handleThresholdChange = (value: number) => {
    // console.log('HomePage: Threshold slider changed:', value);
    if (typeof setThresholdValue === 'function') {
      setThresholdValue(value);
    } else {
      console.error('setThresholdValue is not a function:', setThresholdValue);
    }
  };

  const handleSkewChange = (value: number) => {
    // console.log('HomePage: Skew slider changed:', value);
    if (typeof setSkewValue === 'function') {
      setSkewValue(value);
    } else {
      console.error('setSkewValue is not a function:', setSkewValue);
    }
  };

  return (
    <div>
      {/* <Title order={4} className={classes.title}>
        Adjustments
      </Title> */}
      
      <Stack spacing="md" style={{ maxWidth: 400, margin: '20px 0' }}>
        <Slider
          label="Lowest Visible Value"
          min={0}
          max={100}
          value={thresholdValue}
          onChange={handleThresholdChange}
          onChangeEnd={(value) => console.log('Threshold slider change ended:', value)}
        />
        <Slider
          label="Color Gradient Skew"
          min={0}
          max={1}
          step={0.01}
          value={skewValue}
          onChange={handleSkewChange}
          onChangeEnd={(value) => console.log('Skew slider change ended:', value)}
        />
      </Stack>
    </div>
  );
}