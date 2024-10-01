"use client"; // This directive ensures the component is rendered on the client side

import { useEffect, useState } from 'react';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Welcome } from '../components/Welcome/Welcome';
import { DoubleNavbar } from '../components/DoubleNavbar/DoubleNavbar'; // Adjust the path as necessary

export default function HomePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/data`);
        if (!response.ok) {
          const errorDetails = await response.text(); // Get response text
          throw new Error(`Network response was not ok: ${errorDetails}`);
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Fetch error:', error); // Log full error details
        setError(error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
    <ColorSchemeToggle />
    <DoubleNavbar />
      {error && <p>Error fetching data: {error.message}</p>}
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre> // Displaying the data as JSON
      ) : (
        <p>Loading...</p>
      )}
    </>
  );
}
