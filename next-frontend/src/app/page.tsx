"use client";

import { useEffect, useState } from 'react';
import { Container, Flex, Box } from '@mantine/core';
import { MainLayout } from '../components/MainLayout';

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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
        setError(error);
      }
    };

    fetchData();
  }, []);

  return (
    <MainLayout>
      {/* <Container size="xl" p={0} style={{ height: '100vh' }}>
        <Flex style={{ height: '100%' }}>
          <Box w="75%" h="100%" style={{ position: 'relative', overflow: 'hidden' }}>
            {error && <p>Error fetching data: {error.message}</p>}
            {data ? (
              <pre>{JSON.stringify(data, null, 2)}</pre>
            ) : (
              <p>Loading...</p>
            )}
          </Box>
        </Flex>
      </Container> */}
    </MainLayout>
  );
}