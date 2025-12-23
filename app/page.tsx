'use client';

import { useEffect, useState, useMemo } from 'react';
import EpisodeCard from '@/components/EpisodeCard';
import { EpisodeWithLanguage } from '@/lib/episodes';
import { format } from 'date-fns';

export default function Home() {
  const [episodes, setEpisodes] = useState<EpisodeWithLanguage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<string>('all'); // 'all', 'Obersorbisch', 'Niedersorbisch'
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEpisodes();
  }, []);

  async function fetchEpisodes() {
    try {
      setLoading(true);
      const response = await fetch('/api/episodes');
      if (!response.ok) {
        throw new Error('Failed to fetch episodes');
      }
      const data = await response.json();
      setEpisodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // Filter episodes based on search and filters
  const filteredEpisodes = useMemo(() => {
    let filtered = [...episodes];

    // Search filter (title and description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ep => 
        ep.displayTitle.toLowerCase().includes(query) ||
        ep.displayDescription.toLowerCase().includes(query)
      );
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(ep => ep.displayLanguage === languageFilter);
    }

    // Date filters
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(ep => {
        if (!ep.timestamp) return false;
        const epDate = new Date(ep.timestamp * 1000);
        epDate.setHours(0, 0, 0, 0);
        return epDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(ep => {
        if (!ep.timestamp) return false;
        const epDate = new Date(ep.timestamp * 1000);
        epDate.setHours(23, 59, 59, 999);
        return epDate <= toDate;
      });
    }

    return filtered;
  }, [episodes, searchQuery, languageFilter, dateFrom, dateTo]);

  // Group filtered episodes by language
  const obersorbisch = filteredEpisodes.filter(e => e.displayLanguage === 'Obersorbisch');
  const niedersorbisch = filteredEpisodes.filter(e => e.displayLanguage === 'Niedersorbisch');
  const other = filteredEpisodes.filter(e => 
    e.displayLanguage !== 'Obersorbisch' && e.displayLanguage !== 'Niedersorbisch'
  );

  // Get date range for date inputs (min/max from episodes)
  const dateRange = useMemo(() => {
    if (episodes.length === 0) return { min: '', max: '' };
    
    const timestamps = episodes
      .map(e => e.timestamp)
      .filter(ts => ts > 0);
    
    if (timestamps.length === 0) return { min: '', max: '' };
    
    const minDate = new Date(Math.min(...timestamps) * 1000);
    const maxDate = new Date(Math.max(...timestamps) * 1000);
    
    return {
      min: format(minDate, 'yyyy-MM-dd'),
      max: format(maxDate, 'yyyy-MM-dd'),
    };
  }, [episodes]);

  function clearFilters() {
    setSearchQuery('');
    setLanguageFilter('all');
    setDateFrom('');
    setDateTo('');
  }

  const hasActiveFilters = searchQuery.trim() || languageFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <img
            src="https://www.mdr.de/sandmann/sandmann824-resimage_v-variantBig24x9_w-2560.jpg?version=55897"
            alt="Sandmännchen"
            className="w-full h-auto rounded-lg"
          />
          <h1 className="text-4xl font-semibold mt-6 text-white">
            Pěskowčik – Stream Now!
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-emerald-500/10 border border-emerald-400/40 rounded-lg p-4 mb-6">
          <p className="text-emerald-200">
            Diese App befindet sich noch im Aufbau und in der Entwicklung
          </p>
        </div>

        <div className="prose prose-invert max-w-none mb-8">
          <p>
            Um sich nicht mit den Mediatheken oder Google herumärgern zu müssen und um die wenigen aktuell verfügbaren sorbischen Folgen schnell griffbereit zu haben, habe ich diese App entwickelt.
          </p>
          <p>
            Diese App nutzt die ARD Mediathek API, um sorbischsprachige Sandmännchen‑Folgen zu finden und anzuzeigen.
          </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-slate-400">Lade Daten von der Mediathek…</p>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 rounded-lg p-4 mb-6">
            <p className="text-rose-200">Fehler: {error}</p>
          </div>
        )}

        {!loading && !error && episodes.length === 0 && (
          <div className="bg-amber-500/10 border border-amber-400/40 rounded-lg p-4">
            <p className="text-amber-200">
              Derzeit sind keine sorbischsprachigen Sandmännchen‑Folgen verfügbar.
            </p>
          </div>
        )}

        {!loading && !error && (
          <>
            {episodes.length > 0 && (
              <>
            {/* Search and Filter Section */}
            <div className="mb-8 bg-slate-900 border border-slate-800 rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                {/* Search Input */}
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-slate-200 mb-2">
                    Suche
                  </label>
                  <input
                    id="search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nach Titel oder Beschreibung suchen..."
                    className="w-full px-4 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-800 text-white"
                  />
                </div>
                
                {/* Filter Toggle */}
                <div className="flex items-end">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors border border-slate-700"
                  >
                    {showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
                    {hasActiveFilters && (
                      <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-slate-950 bg-emerald-400 rounded-full">
                        {[searchQuery, languageFilter !== 'all' ? 1 : 0, dateFrom ? 1 : 0, dateTo ? 1 : 0].filter(Boolean).length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Language Filter */}
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-slate-200 mb-2">
                        Sprache
                      </label>
                      <select
                        id="language"
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-800 text-white"
                      >
                        <option value="all">Alle Sprachen</option>
                        <option value="Obersorbisch">Obersorbisch</option>
                        <option value="Niedersorbisch">Niedersorbisch</option>
                      </select>
                    </div>

                    {/* Date From */}
                    <div>
                      <label htmlFor="dateFrom" className="block text-sm font-medium text-slate-200 mb-2">
                        Von Datum
                      </label>
                      <input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        min={dateRange.min}
                        max={dateRange.max}
                        className="w-full px-4 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-800 text-white"
                      />
                    </div>

                    {/* Date To */}
                    <div>
                      <label htmlFor="dateTo" className="block text-sm font-medium text-slate-200 mb-2">
                        Bis Datum
                      </label>
                      <input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        min={dateFrom || dateRange.min}
                        max={dateRange.max}
                        className="w-full px-4 py-2 border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-slate-800 text-white"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {hasActiveFilters && (
                    <div className="mt-4">
                      <button
                        onClick={clearFilters}
                        className="text-sm text-emerald-300 hover:underline"
                      >
                        Filter zurücksetzen
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Results Count */}
              <div className="mt-4 text-sm text-slate-400">
                {hasActiveFilters ? (
                  <>
                    {filteredEpisodes.length} von {episodes.length} Folgen
                  </>
                ) : (
                  <>
                    {episodes.length} {episodes.length === 1 ? 'Folge' : 'Folgen'} verfügbar
                  </>
                )}
              </div>
            </div>

            <div className="mb-8 space-x-4">
              <a
                href="/api/episodes/rss"
                download="sandmaennchen_sorbisch.xml"
                className="inline-block bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                RSS‑Feed herunterladen
              </a>
            </div>

            {filteredEpisodes.length === 0 ? (
              <div className="bg-amber-500/10 border border-amber-400/40 rounded-lg p-4">
                <p className="text-amber-200">
                  Keine Folgen gefunden, die den Suchkriterien entsprechen.
                </p>
              </div>
            ) : (
              <>
                {obersorbisch.length > 0 && (
                  <section className="mb-12">
                    <h2 className="text-3xl font-semibold mb-6 text-white">
                      Obersorbisch {hasActiveFilters && `(${obersorbisch.length})`}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {obersorbisch.map(episode => (
                        <EpisodeCard key={episode.url_website} episode={episode} />
                      ))}
                    </div>
                  </section>
                )}

                {niedersorbisch.length > 0 && (
                  <section className="mb-12">
                    <h2 className="text-3xl font-semibold mb-6 text-white">
                      Niedersorbisch {hasActiveFilters && `(${niedersorbisch.length})`}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {niedersorbisch.map(episode => (
                        <EpisodeCard key={episode.url_website} episode={episode} />
                      ))}
                    </div>
                  </section>
                )}

                {other.length > 0 && (
                  <section className="mb-12">
                    <h2 className="text-3xl font-semibold mb-6 text-white">
                      Weitere Folgen {hasActiveFilters && `(${other.length})`}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {other.map(episode => (
                        <EpisodeCard key={episode.url_website} episode={episode} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-slate-400">
          <p>
            <a
              href="https://github.com/max2058/stream.peskowcik"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GitHub Repository
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
