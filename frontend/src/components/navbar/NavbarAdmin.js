import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, Flex, Link, Text, useColorModeValue } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import AdminNavbarLinks from 'components/navbar/NavbarLinksAdmin';

export default function AdminNavbar(props) {
  const { brandText, onOpen } = props;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const changeNavbar = () => setScrolled(window.scrollY > 1);
    window.addEventListener('scroll', changeNavbar);
    return () => window.removeEventListener('scroll', changeNavbar);
  }, []);

  let mainText = useColorModeValue('navy.700', 'white');
  let secondaryText = useColorModeValue('gray.700', 'white');
  let navbarBg = useColorModeValue('rgba(244, 247, 254, 0.2)', 'rgba(11,20,55,0.5)');

  return (
    <Box
      position="fixed"
      bg={navbarBg}
      backdropFilter="blur(20px)"
      borderRadius="16px"
      borderWidth="1.5px"
      borderStyle="solid"
      borderColor="transparent"
      boxShadow={scrolled ? '14px 17px 40px 4px rgba(112, 144, 176, 0.18)' : 'none'}
      alignItems="center"
      display="flex"
      minH="75px"
      justifyContent="center"
      mx="auto"
      pb="8px"
      right={{ base: '12px', md: '30px', xl: '30px' }}
      px={{ sm: '15px', md: '10px' }}
      ps={{ xl: '12px' }}
      pt="8px"
      top={{ base: '12px', md: '16px', xl: '20px' }}
      w={{
        base: 'calc(100vw - 6%)',
        md: 'calc(100vw - 8%)',
        xl: 'calc(100vw - 350px)',
      }}
    >
      <Flex w="100%" alignItems="center" flexDirection="row" mb="0">
        <Box mb={{ sm: '8px', md: '0px' }}>
          <Breadcrumb>
            <BreadcrumbItem color={secondaryText} fontSize="sm" mb="5px">
              <BreadcrumbLink href="#" color={secondaryText}>Vantage</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem color={secondaryText} fontSize="sm" mb="5px">
              <BreadcrumbLink href="#" color={secondaryText}>{brandText}</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <Link
            color={mainText}
            href="#"
            bg="inherit"
            borderRadius="inherit"
            fontWeight="bold"
            fontSize="34px"
            _hover={{ color: mainText }}
            _active={{ bg: 'inherit', transform: 'none', borderColor: 'transparent' }}
            _focus={{ boxShadow: 'none' }}
          >
            {brandText}
          </Link>
        </Box>
        <Box ms="auto" w={{ sm: '100%', md: 'unset' }}>
          <AdminNavbarLinks onOpen={onOpen} />
        </Box>
      </Flex>
    </Box>
  );
}
