"use client";

import { useEffect, useState } from 'react';
import { Container, Flex, Box } from '@mantine/core';
import { MainLayout } from '../components/MainLayout';

// Define a type for your error state
type ErrorType = Error | null;

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState<ErrorType>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/data`);
        if (!response.ok) {
          const errorDetails = await response.text();
          throw new Error(`Network response was not ok: ${errorDetails}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Fetch error:', error);
        // Cast the error to ErrorType
        setError(error as ErrorType);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      {<></>}
    </MainLayout>
  );
}