"use client";

import React, { useState } from 'react';
import { UnstyledButton, Tooltip, Title, rem } from '@mantine/core';
import {
  IconHome2,
  IconGauge,
  IconDeviceDesktopAnalytics,
  // IconFingerprint,
  // IconCalendarStats,
  // IconUser,
  // IconSettings,
} from '@tabler/icons-react';
import classes from './DoubleNavbar.module.css';
import { HomePage } from './HomePage';
import { DashboardPage_Beam } from './DashboardPage_Beam';
import { DashboardPage_Fractal } from './DashboardPage_Fractal';
import { AnalyticsPage_Beam } from './AnalyticsPage_Beam';
import { AnalyticsPage_Fractal } from './AnalyticsPage_Fractal';

interface DoubleNavbarProps {
  thresholdValue: number;
  setThresholdValue: (value: number) => void;
  skewValue: number;
  setSkewValue: (value: number) => void;
  pointsData: { x: number; y: number; z: number; value: number }[];
  setSelectedFile: (file: string) => void;
  minValue: number;
  maxValue: number;
  hideHalfPoints: boolean;
  setHideHalfPoints: (hide: boolean) => void;
  beamEnergy: string;
  setBeamEnergy: (value: string) => void;
  beamSize: string;
  setBeamSize: (value: string) => void;
  material: string;
  setMaterial: (value: string) => void;
  simulationType: 'beam' | 'fractal';
  setSimulationType: (type: 'beam' | 'fractal') => void;
  fractalType: string | null;
  setFractalType: (type: string | null) => void;
}

const mainLinksMockdata = [
  { icon: IconHome2, label: 'Home' },
  { icon: IconGauge, label: 'Dashboard' },
  { icon: IconDeviceDesktopAnalytics, label: 'Analytics' },
  // { icon: IconCalendarStats, label: 'Releases' },
  // { icon: IconUser, label: 'Account' },
  // { icon: IconFingerprint, label: 'Security' },
  // { icon: IconSettings, label: 'Settings' },
];

export function DoubleNavbar({ 
  thresholdValue, setThresholdValue, 
  skewValue, setSkewValue, 
  pointsData,
  setSelectedFile,
  minValue,
  maxValue,
  hideHalfPoints,
  setHideHalfPoints,
  beamEnergy,
  setBeamEnergy,
  beamSize,
  setBeamSize,
  material,
  setMaterial,
  simulationType,
  setSimulationType,
  fractalType,
  setFractalType
}: DoubleNavbarProps) {
  // Change the initial state to 0 (Home)
  const [active, setActive] = useState(0);

  const mainLinks = mainLinksMockdata.map((link, index) => (
    <Tooltip
      label={link.label}
      position="right"
      withArrow
      transitionProps={{ duration: 0 }}
      key={link.label}
    >
      <UnstyledButton
        onClick={() => setActive(index)}
        className={classes.mainLink}
        data-active={index === active || undefined}
      >
        <link.icon style={{ width: rem(22), height: rem(22) }} stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  ));

  const renderContent = () => {
    switch (active) {
      case 0: // Home
        return <HomePage setSimulationType={(type) => {
          setSimulationType(type);
          setActive(1); // Move to Dashboard when a simulation type is selected
        }} />;
      case 1: // Dashboard
        return simulationType === 'beam' ? (
          <DashboardPage_Beam
            thresholdValue={thresholdValue}
            setThresholdValue={setThresholdValue}
            skewValue={skewValue}
            setSkewValue={setSkewValue}
            setSelectedFile={setSelectedFile}
            minValue={minValue}
            maxValue={maxValue}
            beamEnergy={beamEnergy}
            setBeamEnergy={setBeamEnergy}
            beamSize={beamSize}
            setBeamSize={setBeamSize}
            material={material}
            setMaterial={setMaterial}
            hideHalfPoints={hideHalfPoints}
            setHideHalfPoints={setHideHalfPoints}
          />
        ) : (
          <DashboardPage_Fractal
            fractalType={fractalType}
            setFractalType={setFractalType}
          />
        );
      case 2: // Analytics
        console.log("DoubleNavbar pointsData:", pointsData);
        return simulationType === 'beam' ? (
          <AnalyticsPage_Beam pointsData={pointsData} />
        ) : (
          <AnalyticsPage_Fractal fractalType={fractalType} />
        );
      // ... other cases ...
      default:
        return <div>Select a section</div>;
    }
  };

  return (
    <nav className={classes.navbar}>
      <div className={classes.wrapper}>
        <div className={classes.aside}>
          <div className={classes.logo}>
            {/* You can add your logo here */}
          </div>
          {mainLinks}
        </div>
        <div className={classes.main}>
          <Title order={4} className={classes.title}>
            {mainLinksMockdata[active].label}
          </Title>
          {renderContent()}
        </div>
      </div>
    </nav>
  );
}
