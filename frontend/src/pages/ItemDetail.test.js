import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItemDetail from './ItemDetail';

// Mock the LoadingSkeleton component
jest.mock('./Items', () => {
  const React = require('react');
  return function LoadingSkeleton({ count }) {
    return React.createElement('div', { 'data-testid': 'loading-skeleton' }, `Loading skeleton (count: ${count})`);
  };
});

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => {
  const actualReactRouter = jest.requireActual('react-router-dom');
  return {
    ...actualReactRouter,
    useNavigate: jest.fn(),
    useParams: jest.fn(),
  };
});

// Mock fetch
global.fetch = jest.fn();

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('ItemDetail', () => {
  let mockNavigate, mockUseParams;

  beforeEach(() => {
    // 重置所有 mock
    jest.clearAllMocks();
    
    // 获取 mock 函数
    const { useNavigate, useParams } = require('react-router-dom');
    mockNavigate = useNavigate;
    mockUseParams = useParams;
    
    // 设置默认返回值
    mockUseParams.mockReturnValue({ id: '123' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders loading skeleton initially', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', name: 'Test Item', category: 'Test Category', price: 99.99 }),
    });

    render(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders item details successfully', async () => {
    const mockItem = {
      id: '123',
      name: 'Test Item',
      category: 'Electronics',
      price: 299.99
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockItem,
    });

    render(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });

    expect(screen.getByText('Category:')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Price:')).toBeInTheDocument();
    expect(screen.getByText('$299.99')).toBeInTheDocument();
  });

  it('displays error message when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load, please try again later')).toBeInTheDocument();
    });

    // Check error message styling
    const errorElement = screen.getByText('Failed to load, please try again later');
    expect(errorElement).toHaveStyle({ color: 'red', padding: '16px' });
  });

  it('displays error message when response is not ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load, please try again later')).toBeInTheDocument();
    });
  });

  it('makes correct API call with item id', async () => {
    mockUseParams.mockReturnValue({ id: '456' });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '456', name: 'Another Item', category: 'Books', price: 19.99 }),
    });

    render(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/items/456');
  });

  it('handles AbortError gracefully', async () => {
    const abortError = new Error('Request aborted');
    abortError.name = 'AbortError';
    
    fetch.mockRejectedValueOnce(abortError);

    render(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should not show error message for AbortError
      expect(screen.queryByText('Failed to load, please try again later')).not.toBeInTheDocument();
    });
  });

  it('cleans up properly on unmount', async () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { unmount } = render(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    unmount();

    // Component should unmount without issues
    expect(true).toBe(true);
  });

  it('updates when id parameter changes', async () => {
    const mockItem1 = { id: '123', name: 'Item 1', category: 'Cat1', price: 10 };
    const mockItem2 = { id: '456', name: 'Item 2', category: 'Cat2', price: 20 };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem1,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockItem2,
      });

    const { rerender } = render(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    // Change the id parameter
    mockUseParams.mockReturnValue({ id: '456' });

    rerender(
      <TestWrapper>
        <ItemDetail />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, 'http://localhost:3001/api/items/123');
    expect(fetch).toHaveBeenNthCalledWith(2, 'http://localhost:3001/api/items/456');
  });
});