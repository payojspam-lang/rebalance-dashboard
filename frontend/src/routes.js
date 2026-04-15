import React from 'react';

import { Icon } from '@chakra-ui/react';
import {
  MdAnalytics,
  MdSwapHoriz,
  MdBusiness,
  MdHistory,
  MdSettings,
} from 'react-icons/md';

// Vantage Imports
import ResearchDashboard from 'views/admin/research-dashboard';
import RebalancePage from 'views/admin/rebalance';
import BseOrderFile from 'views/admin/bse-order-file';
import AuditLog from 'views/admin/audit-log';
import ConfigurationPage from 'views/admin/configuration';
import UserDetailPage from 'views/admin/user-detail';

const routes = [
  {
    name: 'Research Dashboard',
    layout: '/admin',
    path: '/research-dashboard',
    icon: <Icon as={MdAnalytics} width="20px" height="20px" color="inherit" />,
    component: <ResearchDashboard />,
  },
  {
    name: 'Rebalance',
    layout: '/admin',
    path: '/rebalance',
    icon: <Icon as={MdSwapHoriz} width="20px" height="20px" color="inherit" />,
    component: <RebalancePage />,
  },
  {
    name: 'BSE Order File',
    layout: '/admin',
    path: '/bse-order-file',
    icon: <Icon as={MdBusiness} width="20px" height="20px" color="inherit" />,
    component: <BseOrderFile />,
  },
  {
    name: 'Audit Log',
    layout: '/admin',
    path: '/audit-log',
    icon: <Icon as={MdHistory} width="20px" height="20px" color="inherit" />,
    component: <AuditLog />,
  },
  {
    name: 'Configuration',
    layout: '/admin',
    path: '/configuration',
    icon: <Icon as={MdSettings} width="20px" height="20px" color="inherit" />,
    component: <ConfigurationPage />,
  },
  {
    name: 'User Detail',
    layout: '/admin',
    path: '/rebalance/user/:userId',
    hidden: true,
    component: <UserDetailPage />,
  },
];

export default routes;
