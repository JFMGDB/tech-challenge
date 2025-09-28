import React from 'react';
import styled from 'styled-components';
import { Container, Box, Text, Flex } from '../ui';

const FooterContainer = styled.footer`
  background-color: ${({ theme }) => theme.colors.gray[900]};
  color: ${({ theme }) => theme.colors.gray[300]};
  margin-top: auto;
`;

const PaddedBox = styled(Box)`
  padding: ${({ theme }) => theme.space[8]};
`;

const DividerBox = styled(Box)`
  border-top: 1px solid ${({ theme }) => theme.colors.gray[700]};
  padding-top: ${({ theme }) => theme.space[4]};
  margin-top: ${({ theme }) => theme.space[8]};
`;

const TitleText = styled(Text)`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.gray[50]};
  margin-bottom: ${({ theme }) => theme.space[2]};
`;

const MutedText = styled(Text)`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const CenterMutedText = styled(MutedText)`
  display: block;
  text-align: center;
`;

const FooterLink = styled.a`
  color: ${({ theme }) => theme.colors.gray[400]};
  text-decoration: none;
  transition: color 0.2s ease-in-out;
  
  &:hover {
    color: ${({ theme }) => theme.colors.gray[50]};
    text-decoration: underline;
  }
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <Container>
        <PaddedBox>
          <Flex style={{ display: 'flex', flexDirection: 'column' }}>
            <Flex style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Box>
              <TitleText>TechBlog</TitleText>
              <MutedText>A modern blog platform for developers</MutedText>
            </Box>
            
              <Flex style={{ display: 'flex', gap: '1.5rem' }}>
              <FooterLink href="#about">About</FooterLink>
              <FooterLink href="#privacy">Privacy</FooterLink>
              <FooterLink href="#terms">Terms</FooterLink>
              <FooterLink href="#contact">Contact</FooterLink>
            </Flex>
            </Flex>
          </Flex>
          
          <DividerBox>
            <CenterMutedText>
              © {new Date().getFullYear()} TechBlog. All rights reserved.
            </CenterMutedText>
          </DividerBox>
        </PaddedBox>
      </Container>
    </FooterContainer>
  );
};