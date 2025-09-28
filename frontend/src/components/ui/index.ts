import styled, { css } from 'styled-components';
import { 
  space, 
  color, 
  layout, 
  flexbox, 
  typography, 
  border,
  shadow,
  system,
  SpaceProps, 
  ColorProps, 
  LayoutProps, 
  FlexboxProps,
  TypographyProps,
  BorderProps,
  ShadowProps,
  ResponsiveValue
} from 'styled-system';

interface GapProps {
  gap?: ResponsiveValue<string | number>;
}

const gapStyle = system({
  gap: {
    property: 'gap',
    scale: 'space',
  },
});

interface BoxProps extends 
  SpaceProps, 
  ColorProps, 
  LayoutProps, 
  FlexboxProps,
  TypographyProps,
  BorderProps,
  ShadowProps,
  GapProps {}

export const Box = styled.div<BoxProps>`
  ${space}
  ${color}
  ${layout}
  ${flexbox}
  ${typography}
  ${border}
  ${shadow}
  ${gapStyle}
`;

export const Flex = styled(Box)<BoxProps>`
  display: flex;
`;

export const Container = styled(Box)`
  width: 100%;
  margin: 0 auto;
  padding-left: ${({ theme }) => theme.space[4]};
  padding-right: ${({ theme }) => theme.space[4]};
  
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    max-width: ${({ theme }) => theme.sizes.container.sm};
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: ${({ theme }) => theme.sizes.container.md};
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    max-width: ${({ theme }) => theme.sizes.container.lg};
  }
  
  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    max-width: ${({ theme }) => theme.sizes.container.xl};
  }
`;

export const Grid = styled(Box)`
  display: grid;
`;

interface TextProps extends TypographyProps, ColorProps, SpaceProps {
  variant?: 'body' | 'heading' | 'caption' | 'label';
  as?: keyof JSX.IntrinsicElements;
}

export const Text = styled.span<TextProps>`
  ${typography}
  ${color}
  ${space}
  
  ${({ variant, theme }) => {
    switch (variant) {
      case 'heading':
        return css`
          font-family: ${theme.fonts.heading};
          font-weight: ${theme.fontWeights.bold};
          line-height: ${theme.lineHeights.tight};
        `;
      case 'caption':
        return css`
          font-size: ${theme.fontSizes.sm};
          color: ${theme.colors.gray[500]};
        `;
      case 'label':
        return css`
          font-size: ${theme.fontSizes.sm};
          font-weight: ${theme.fontWeights.medium};
        `;
      default:
        return css`
          font-family: ${theme.fonts.body};
          line-height: ${theme.lineHeights.normal};
        `;
    }
  }}
`;

export const Heading = styled(Text).attrs({ as: 'h2', variant: 'heading' })``;

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
}

export const Button = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({ size, theme }) => {
    switch (size) {
      case 'sm':
        return css`
          padding: ${theme.space[2]} ${theme.space[3]};
          font-size: ${theme.fontSizes.sm};
        `;
      case 'lg':
        return css`
          padding: ${theme.space[4]} ${theme.space[6]};
          font-size: ${theme.fontSizes.lg};
        `;
      default:
        return css`
          padding: ${theme.space[3]} ${theme.space[4]};
          font-size: ${theme.fontSizes.base};
        `;
    }
  }}
  
  ${({ variant, theme }) => {
    switch (variant) {
      case 'secondary':
        return css`
          background-color: ${theme.colors.gray[200]};
          color: ${theme.colors.gray[800]};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.gray[300]};
          }
        `;
      case 'outline':
        return css`
          background-color: transparent;
          border-color: ${theme.colors.primary[500]};
          color: ${theme.colors.primary[500]};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary[500]};
            color: white;
          }
        `;
      case 'ghost':
        return css`
          background-color: transparent;
          color: ${theme.colors.primary[500]};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary[50]};
          }
        `;
      default:
        return css`
          background-color: ${theme.colors.primary[500]};
          color: white;
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary[600]};
          }
        `;
    }
  }}
  
  ${({ isLoading }) => 
    isLoading && css`
      pointer-events: none;
      opacity: 0.6;
    `
  }
`;