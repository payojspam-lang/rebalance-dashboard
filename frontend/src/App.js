import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/admin';
import { ChakraProvider } from '@chakra-ui/react';
import initialTheme from './theme/theme';
import { useState } from 'react';
import { RecommendationsProvider } from './contexts/RecommendationsContext';
import { HolidayProvider } from './contexts/HolidayContext';
import { BseOrderProvider } from './contexts/BseOrderContext';

export default function Main() {
  // eslint-disable-next-line
  const [currentTheme] = useState(initialTheme);
  return (
    <ChakraProvider theme={currentTheme}>
      <HolidayProvider>
        <BseOrderProvider>
          <RecommendationsProvider>
            <Routes>
              <Route
                path="admin/*"
                element={<AdminLayout theme={currentTheme} />}
              />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </RecommendationsProvider>
        </BseOrderProvider>
      </HolidayProvider>
    </ChakraProvider>
  );
}
