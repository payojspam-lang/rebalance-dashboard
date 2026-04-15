import { Portal, Box, useDisclosure } from '@chakra-ui/react';
import Footer from 'components/footer/FooterAdmin.js';
import Navbar from 'components/navbar/NavbarAdmin.js';
import Sidebar from 'components/sidebar/Sidebar.js';
import { SidebarContext } from 'contexts/SidebarContext';
import React, { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import routes from 'routes.js';

export default function AdminLayout() {
  const [toggleSidebar, setToggleSidebar] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { onOpen } = useDisclosure();
  const location = useLocation(); // reactive — re-renders on every navigation

  // Derive the active route name from the current pathname (not window.location.href)
  const getActiveRoute = (routes) => {
    // Sort by path length descending so more specific paths (e.g. /rebalance/user/:id)
    // match before shorter prefixes (e.g. /rebalance)
    const sorted = [...routes].sort((a, b) => b.path.length - a.path.length);
    for (const route of sorted) {
      const fullPath = route.layout + route.path;
      // Strip dynamic segments (:userId) before matching
      const staticPart = fullPath.split('/:')[0];
      if (location.pathname.startsWith(staticPart)) {
        return route.name;
      }
    }
    return 'Aegis Rebalance Engine';
  };

  const getRoutes = (routes) =>
    routes.map((route, key) => {
      if (route.layout === '/admin') {
        return <Route path={route.path} element={route.component} key={key} />;
      }
      return null;
    });

  const SIDEBAR_W    = sidebarCollapsed ? '72px' : '290px';
  const CONTENT_W    = `calc(100% - ${SIDEBAR_W})`;

  document.documentElement.dir = 'ltr';

  return (
    <Box>
      <SidebarContext.Provider value={{ toggleSidebar, setToggleSidebar, sidebarCollapsed, setSidebarCollapsed }}>
        <Sidebar routes={routes} display="none" collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((p) => !p)} />
        <Box
          float="right"
          minHeight="100vh"
          height="100%"
          overflow="auto"
          position="relative"
          maxHeight="100%"
          w={{ base: '100%', xl: CONTENT_W }}
          maxWidth={{ base: '100%', xl: CONTENT_W }}
          transition="all 0.25s ease"
        >
          <Portal>
            <Navbar
              onOpen={onOpen}
              brandText={getActiveRoute(routes)}
            />
          </Portal>
          <Box mx="auto" p={{ base: '20px', md: '30px' }} pe="20px" minH="100vh" pt={{ base: "140px", md: "100px" }}>
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
