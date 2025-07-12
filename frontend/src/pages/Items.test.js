import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Items from './Items';
import { useData } from '../state/DataContext';

// Mock react-window and react-virtualized-auto-sizer
jest.mock('react-window', () => ({
  FixedSizeList: ({ children, itemCount, itemData, innerElementType }) => {
    const InnerElement = innerElementType || 'div';
    return (
      <InnerElement data-testid="virtual-list">
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index}>
            {children({ index, style: {}, data: itemData })}
          </div>
        ))}
      </InnerElement>
    );
  },
}));

jest.mock('react-virtualized-auto-sizer', () => {
  return function AutoSizer({ children }) {
    return children({ height: 400, width: 600 });
  };
});

// Mock useData hook
jest.mock('../state/DataContext', () => ({
  useData: jest.fn(),
}));

// Mock AbortController
const mockAbortController = {
  signal: {},
  abort: jest.fn(),
};

beforeAll(() => {
  global.AbortController = jest.fn(() => mockAbortController);
});

describe('Items Component', () => {
  const mockFetchItems = jest.fn();
  const mockItems = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  const defaultUseDataReturn = {
    items: mockItems,
    total: 3,
    fetchItems: mockFetchItems,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchItems.mockResolvedValue();
    useData.mockReturnValue(defaultUseDataReturn);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Items />
      </BrowserRouter>
    );
  };

  describe('Initial Rendering', () => {
   
    it('calls fetchItems on mount', () => {
      renderComponent();
      
      expect(mockFetchItems).toHaveBeenCalledWith(
        { page: 1, pageSize: 20, q: '' },
        expect.any(Object)
      );
    });

    it('renders items as links', () => {
      renderComponent();
      
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      
      const link = screen.getByText('Item 1').closest('a');
      expect(link).toHaveAttribute('href', '/items/1');
    });
  });

  describe('Loading States', () => {
    it('shows loading skeleton when loading is true', () => {
      useData.mockReturnValue({
        ...defaultUseDataReturn,
        loading: true,
      });

      renderComponent();
      
      expect(screen.getAllByTestId('skeleton-item')).toHaveLength(20);
    });

    

    it('hides loading skeleton when loading is false', () => {
      renderComponent();
      
      expect(screen.queryByTestId('skeleton-item')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows "No items found" when items array is empty', () => {
      useData.mockReturnValue({
        ...defaultUseDataReturn,
        items: [],
        total: 0,
      });

      renderComponent();
      
      expect(screen.getByText('No items found.')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('updates search input value', () => {
      renderComponent();
      
      const searchInput = screen.getByLabelText('Search items');
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      
      expect(searchInput.value).toBe('test query');
    });

    it('performs search on form submission', async () => {
      renderComponent();
      
      const searchInput = screen.getByLabelText('Search items');
      const searchButton = screen.getByRole('button', { name: 'Search' });
      
      fireEvent.change(searchInput, { target: { value: 'test query' } });
      fireEvent.click(searchButton);
      
      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalledWith(
          { page: 1, pageSize: 20, q: 'test query' },
          expect.any(Object)
        );
      });
    });


  });

  describe('Pagination', () => {
    beforeEach(() => {
      useData.mockReturnValue({
        ...defaultUseDataReturn,
        total: 50, // 3 pages with pageSize 20
      });
    });

    it('displays current page and total pages', () => {
      renderComponent();
      
      expect(screen.getByText('Page 1 / 3')).toBeInTheDocument();
    });

    it('disables Previous button on first page', () => {
      renderComponent();
      
      const prevButton = screen.getByRole('button', { name: 'Previous page' });
      expect(prevButton).toBeDisabled();
    });

    it('enables Next button when not on last page', () => {
      renderComponent();
      
      const nextButton = screen.getByRole('button', { name: 'Next page' });
      expect(nextButton).not.toBeDisabled();
    });

    it('goes to next page when Next button is clicked', async () => {
      renderComponent();
      
      const nextButton = screen.getByRole('button', { name: 'Next page' });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalledWith(
          { page: 2, pageSize: 20, q: '' },
          expect.any(Object)
        );
      });
    });

    it('goes to previous page when Previous button is clicked', async () => {
      renderComponent();
      
      // First go to page 2
      const nextButton = screen.getByRole('button', { name: 'Next page' });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Page 2 / 3')).toBeInTheDocument();
      });
      
      // Then go back to page 1
      const prevButton = screen.getByRole('button', { name: 'Previous page' });
      fireEvent.click(prevButton);
      
      await waitFor(() => {
        expect(mockFetchItems).toHaveBeenCalledWith(
          { page: 1, pageSize: 20, q: '' },
          expect.any(Object)
        );
      });
    });

    it('disables pagination buttons when loading', () => {
      useData.mockReturnValue({
        ...defaultUseDataReturn,
        loading: true,
        total: 50,
      });

      renderComponent();
      
      const prevButton = screen.getByRole('button', { name: 'Previous page' });
      const nextButton = screen.getByRole('button', { name: 'Next page' });
      
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('handles fetchItems error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchItems.mockRejectedValue(new Error('Network error'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper aria labels', () => {
      renderComponent();
      
      expect(screen.getByLabelText('Search items')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

  });
});