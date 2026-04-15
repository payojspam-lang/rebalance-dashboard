import { Portal, Box, useDisclosure } from '@chakra-ui/react';
import Footer from 'components/footer/FooterAdmin.js';
import Navbar from 'components/navbar/NavbarAdmin.js';
import Sidebar from 'components/sidebar/Sidebar.js';
import { SidebarContext } from 'contexts/SidebarContext';
import React, { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import routes from 'routes.js';

export default function AdminLayout() {
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const { onOpen } = useDisclosure();

  const getActiveRoute = (routes) => {
    for (let i = 0; i < routes.length; i++) {
      if (window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1) {
        return routes[i].name;
      }
    }
    return 'Vantage Rebalancing';
  };

  const getRoutes = (routes) =>
    routes.map((route, key) => {
      if (route.layout === '/admin') {
        return <Route path={route.path} element={route.component} key={key} />;
      }
      return null;
    });

  document.documentElement.dir = 'ltr';

  return (
    <Box>
      <SidebarContext.Provider value={{ toggleSidebar, setToggleSidebar }}>
        <Sidebar routes={routes} display="none" />
        <Box
          float="right"
          minHeight="100vh"
          height="100%"
          overflow="auto"
          position="relative"
          maxHeight="100%"
          w={{ base: '100%', xl: 'calc(100% - 290px)' }}
          maxWidth={{ base: '100%', xl: 'calc(100% - 290px)' }}
          transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
          transitionDuration=".2s, .2s, .35s"
          transitionProperty="top, bottom, width"
          transitionTimingFunction="linear, linear, ease"
        >
          <Portal>
            <Navbar
              onOpen={onOpen}
              brandText={getActiveRoute(routes)}
            />
          </Portal>
          <Box mx="auto" p={{ base: '20px', md: '30px' }} pe="20px" minH="100vh" pt="50px">
            <Routes>
              {getRoutes(routes)}
              <Route path="/" element={<Navigate to="/admin/research-dashboard" replace />} />
            </Routes>
          </Box>
          <Footer />
        </Box>
      </SidebarContext.Provider>
    </Box>
  );
}
