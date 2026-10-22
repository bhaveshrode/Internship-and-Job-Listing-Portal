import { useEffect, useState } from 'react';
import { api } from '../api/client';
import OpportunityCard from '../components/OpportunityCard';
import SearchFilterBar from '../components/SearchFilterBar';

export default function ListingPage() {
  const [items, setItems] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Load domains once for the filter dropdown
  useEffect(() => {
    api
      .getDomains()
      .then(setDomains)
      .catch(() => setDomains([]));
  }, []);

  // Load opportunities whenever search/domain/page changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const timer = setTimeout(() => {
      api
        .getOpportunities({ search, domain, page })
        .then((data) => {
          if (cancelled) return;
          setItems(data.items);
          setPages(data.pages || 1);
          setTotal(data.total);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300); // debounce typing

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, domain, page]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleDomainChange = (value) => {
    setDomain(value);
    setPage(1);
  };

  return (
    <section className="listing-page">
      <div className="hero">
        <h1>Find Your Next Opportunity</h1>
        <p>Browse and apply to the latest internships and jobs.</p>
      </div>

      <SearchFilterBar
        search={search}
        domain={domain}
        domains={domains}
        onSearchChange={handleSearchChange}
        onDomainChange={handleDomainChange}
      />

      {loading && <p className="status-message">Loading opportunities...</p>}
      {error && <p className="status-message error">⚠️ {error}</p>}

      {!loading && !error && (
        <>
          <p className="results-count">
            {total} opportunit{total === 1 ? 'y' : 'ies'} found
          </p>

          {items.length === 0 ? (
            <p className="status-message">No opportunities match your search.</p>
          ) : (
            <div className="card-grid">
              {items.map((op) => (
                <OpportunityCard key={op._id} opportunity={op} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                ← Prev
              </button>
              <span className="page-info">
                Page {page} of {pages}
              </span>
              <button
                className="btn btn-outline"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
