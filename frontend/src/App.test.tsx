import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useAuth', () => {
  const React = require('react');
  return {
    __esModule: true,
    useAuth: () => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

jest.mock('./components/layout/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('./pages/auth/LoginPage', () => ({
  LoginPage: () => <h1>Welcome Back</h1>,
}));

describe('App', () => {
  it('renders the login page heading when navigating to /login', async () => {
    window.history.pushState({}, 'Login page', '/login');

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: /welcome back/i })
    ).toBeInTheDocument();
  });
});