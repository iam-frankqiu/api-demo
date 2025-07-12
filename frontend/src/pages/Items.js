import React, { useEffect, useRef, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function LoadingSkeleton({ count = 20 }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
      {Array.from({ length: count }).map((_, i) => (
        <li
          key={i}
          data-testid="skeleton-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #eee',
            padding: '0 16px',
            listStyle: 'none',
            height: 48,
          }}
        >
          <div style={{ width: 160, height: 20, background: '#eee', borderRadius: 4 }} />
        </li>
      ))}
    </ul>
  );
}

function Items() {
  const { items, total, fetchItems, loading: globalLoading } = useData();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef();

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new window.AbortController();
    abortRef.current = controller;
    setLoading(true);
    fetchItems({ page, pageSize, q: search }, controller.signal)
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [fetchItems, page, pageSize, search]);

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    setSearch(q);
  };

  const isLoading = typeof globalLoading === 'boolean' ? globalLoading : loading;

  const totalPages = Math.ceil(total / pageSize);

  // Row renderer for react-window
  const Row = ({ index, style, data }) => {
    const item = data[index];
    return (
      <li
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          padding: '0 16px',
          listStyle: 'none',
        }}
      >
        <Link to={'/items/' + item.id} style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 500 }}>
          {item.name}
        </Link>
      </li>
    );
  };

  // Use innerElementType to render <ul> for the list
  const InnerListElement = React.forwardRef(function InnerListElement(props, ref) {
    return <ul ref={ref} style={{ ...props.style, margin: 0, padding: 0, listStyle: 'none' }}>{props.children}</ul>;
  });

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', padding: 16 }}>
      <form onSubmit={handleSearch} style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <input
          aria-label="Search items"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#1976d2', color: '#fff' }}>
          Search
        </button>
      </form>
      {isLoading ? (
        <LoadingSkeleton count={pageSize} />
      ) : items.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <div style={{ height: 400 }}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={items.length}
                itemSize={48}
                width={width}
                itemData={items}
                innerElementType={InnerListElement}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1 || isLoading}
          aria-label="Previous page"
          style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: page === 1 ? '#eee' : '#fff' }}
        >
          Previous
        </button>
        <span style={{ alignSelf: 'center' }}>Page {page} / {totalPages || 1}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0 || isLoading}
          aria-label="Next page"
          style={{ padding: '8px 16px', borderRadius: 4, border: '1px solid #ccc', background: '#fff' }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Items;