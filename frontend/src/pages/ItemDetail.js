import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSkeleton from './Items';

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;
    fetch('http://localhost:3001/api/items/' + id)
      .then(res => {
        if (res.status === 404) {
          navigate('/');
          return null;
        }
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        if (!ignore && data) setItem(data);
      })
      .catch(err => {
        if (!ignore && err.name !== 'AbortError') setError('Failed to load, please try again later');
      });
    return () => { ignore = true; };
  }, [id, navigate]);

  if (error) return <div style={{padding: 16, color: 'red'}}>{error}</div>;
  if (!item) return <div style={{padding: 16}}><LoadingSkeleton count={1} /></div>;

  return (
    <div style={{padding: 16}}>
      <h2>{item.name}</h2>
      <p><strong>Category:</strong> {item.category}</p>
      <p><strong>Price:</strong> ${item.price}</p>
    </div>
  );
}

export default ItemDetail;