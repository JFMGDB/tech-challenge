import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Container, Box, Heading, Text, Button } from '../../components/ui';
import { Form, FormGroup, Label, Input, ErrorText } from '../../components/forms';
import { useAuth } from '../../hooks/useAuth';
import { LoginRequest } from '../../types';
import { toast } from 'react-toastify';

export const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="400px" mx="auto">
      <Box 
        bg="white" 
        p={8} 
        borderRadius="lg" 
        boxShadow="md"
      >
        <Heading as="h1" textAlign="center" mb={6}>
          Welcome Back
        </Heading>
        
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              hasError={!!errors.email}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              hasError={!!errors.password}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            {errors.password && <ErrorText>{errors.password.message}</ErrorText>}
          </FormGroup>
          
          <Button 
            type="submit" 
            fullWidth
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </Form>
        
        <Text textAlign="center" mt={6} color="gray.600">
          Don't have an account?{' '}
          <Link to="/register">
            Sign up here
          </Link>
        </Text>
      </Box>
    </Container>
  );
};