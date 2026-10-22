export default function SearchFilterBar({ search, domain, domains, onSearchChange, onDomainChange }) {
  return (
    <div className="search-filter-bar">
      <input
        type="text"
        className="input search-input"
        placeholder="🔍 Search by title or company..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="input domain-select"
        value={domain}
        onChange={(e) => onDomainChange(e.target.value)}
      >
        <option value="">All Domains</option>
        {domains.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    </div>
  );
}
