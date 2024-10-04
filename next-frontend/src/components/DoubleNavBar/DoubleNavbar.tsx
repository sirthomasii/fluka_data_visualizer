"use client";

import React, { useState } from 'react';
import { UnstyledButton, Tooltip, Title, rem, Button, Group } from '@mantine/core';
import {
  IconHome2,
  IconGauge,
  IconDeviceDesktopAnalytics,
  IconFingerprint,
  IconCalendarStats,
  IconUser,
  IconSettings,
} from '@tabler/icons-react';
import classes from './DoubleNavbar.module.css';
import { HomePage } from './HomePage';
import { DashboardPage } from './DashboardPage';
import { AnalyticsPage } from './AnalyticsPage';

interface DoubleNavbarProps {
  thresholdValue: number;
  setThresholdValue: (value: number) => void;
  skewValue: number;
  setSkewValue: (value: number) => void;
  setGeometry: (geometry: string) => void;
  pointsData: { x: number; y: number; z: number; value: number }[];
}

const mainLinksMockdata = [
  { icon: IconHome2, label: 'Home' },
  { icon: IconGauge, label: 'Dashboard' },
  { icon: IconDeviceDesktopAnalytics, label: 'Analytics' },
  { icon: IconCalendarStats, label: 'Releases' },
  { icon: IconUser, label: 'Account' },
  { icon: IconFingerprint, label: 'Security' },
  { icon: IconSettings, label: 'Settings' },
];

export function DoubleNavbar({ thresholdValue, setThresholdValue, skewValue, setSkewValue, setGeometry, pointsData }: DoubleNavbarProps) {
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
        return (
          <HomePage setGeometry={setGeometry} />
        );
      case 1: // Dashboard
        return (
          <DashboardPage
            thresholdValue={thresholdValue}
            setThresholdValue={setThresholdValue}
            skewValue={skewValue}
            setSkewValue={setSkewValue}
          />
        );
      case 2: // Analytics
        console.log("DoubleNavbar pointsData:", pointsData);
        return (
          <AnalyticsPage pointsData={pointsData} />
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
