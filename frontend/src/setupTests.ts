// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Filter noisy warnings/errors during tests while preserving meaningful logs
const originalWarn = console.warn.bind(console);
const originalError = console.error.bind(console);

beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string') {
      // React Router v7 future flags announcements
      if (first.includes('React Router Future Flag Warning')) {
        return;
      }
    }
    // Fallback to original
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalWarn(...(args as any[]));
  });

  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string') {
      // ReactDOMTestUtils.act deprecation and Suspense act() noise under tests
      if (
        first.includes('ReactDOMTestUtils.act') ||
        first.includes('not wrapped in act')
      ) {
        return;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    originalError(...(args as any[]));
  });
});

afterAll(() => {
  (console.warn as unknown as jest.Mock).mockRestore?.();
  (console.error as unknown as jest.Mock).mockRestore?.();
});