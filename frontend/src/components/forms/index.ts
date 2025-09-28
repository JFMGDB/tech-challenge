import styled from 'styled-components';
import { Box, Text } from '../ui';

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
`;

export const FormGroup = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
`;

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
`;

export const Input = styled.input<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[500] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) => 
      hasError ? `${theme.colors.red[500]}20` : `${theme.colors.primary[500]}20`};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

export const TextArea = styled.textarea<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[500] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-family: ${({ theme }) => theme.fonts.body};
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) => 
      hasError ? `${theme.colors.red[500]}20` : `${theme.colors.primary[500]}20`};
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

export const Select = styled.select<{ hasError?: boolean }>`
  padding: ${({ theme }) => theme.space[3]};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[500] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: ${({ theme, hasError }) => 
      hasError ? theme.colors.red[500] : theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme, hasError }) => 
      hasError ? `${theme.colors.red[500]}20` : `${theme.colors.primary[500]}20`};
  }
`;

export const ErrorText = styled(Text)`
  color: ${({ theme }) => theme.colors.red[500]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const HelpText = styled(Text)`
  color: ${({ theme }) => theme.colors.gray[500]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

// Intentional CSS issue: File input styling problems
export const FileInput = styled.input.attrs({ type: 'file' })`
  /* This styling will look broken on different browsers */
  width: 100%;
  padding: ${({ theme }) => theme.space[3]};
  border: 2px dashed ${({ theme }) => theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.gray[50]};
  cursor: pointer;
  /* Show filename text with readable size */
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.gray[700]};
  
  /* This will cause layout issues */
  &::file-selector-button {
    margin-right: 20px;
    border: none;
    background: ${({ theme }) => theme.colors.primary[500]};
    padding: ${({ theme }) => theme.space[2]} ${({ theme }) => theme.space[4]};
    border-radius: ${({ theme }) => theme.radii.sm};
    color: white;
    cursor: pointer;
    transition: background-color 0.2s ease-in-out;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    /* Missing proper positioning and responsive design */
    display: inline-block;
    will-change: background-color, transform;
  }
  
  &::file-selector-button:hover {
    background: ${({ theme }) => theme.colors.primary[600]};
    /* Lightweight interaction without infinite animation */
    transform: translateY(-1px);
  }
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary[500]}20`};
  }
`;