'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { EpisodeWithLanguage } from '@/lib/episodes';

interface SearchTerm {
  id?: number;
  term: string;
  created_at?: string;
  updated_at?: string;
}

interface BlacklistEntry {
  id?: number;
  pattern: string;
  type: 'title' | 'url';
  created_at?: string;
  updated_at?: string;
}

interface EpisodeOverrideForm {
  custom_title: string;
  custom_description: string;
  custom_language: string;
  available_until: string;
}

export default function AdminPage() {
  const [episodes, setEpisodes] = useState<EpisodeWithLanguage[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([]);
  const [blacklistEntries, setBlacklistEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'episodes' | 'search-terms' | 'blacklist'>('episodes');
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [overrideForm, setOverrideForm] = useState<EpisodeOverrideForm>({
    custom_title: '',
    custom_description: '',
    custom_language: '',
    available_until: '',
  });
  const [newSearchTerm, setNewSearchTerm] = useState('');
  const [editingSearchTermId, setEditingSearchTermId] = useState<number | null>(null);
  const [editingSearchTerm, setEditingSearchTerm] = useState('');
  const [newBlacklist, setNewBlacklist] = useState({ pattern: '', type: 'title' as 'title' | 'url' });
  const [editingBlacklistId, setEditingBlacklistId] = useState<number | null>(null);
  const [editingBlacklist, setEditingBlacklist] = useState({ pattern: '', type: 'title' as 'title' | 'url' });

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchAll();
    }
  }, [authenticated]);

  async function checkSession() {
    try {
      setAuthLoading(true);
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      if (data.authenticated) {
        setAuthenticated(true);
        setUser(data.user);
      } else {
        setAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error(error);
      setAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login fehlgeschlagen');
      }
      setAuthenticated(true);
      setUser(data.user);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login fehlgeschlagen');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setUser(null);
  }

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchEpisodes(), fetchSearchTerms(), fetchBlacklist()]);
    setLoading(false);
  }

  async function fetchEpisodes() {
    try {
      const response = await fetch('/api/episodes?includeUnavailable=true');
      if (!response.ok) throw new Error('Failed to fetch episodes');
      const data = await response.json();
      setEpisodes(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchSearchTerms() {
    try {
      const response = await fetch('/api/search-terms');
      if (!response.ok) throw new Error('Failed to fetch search terms');
      const data = await response.json();
      setSearchTerms(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchBlacklist() {
    try {
      const response = await fetch('/api/blacklist');
      if (!response.ok) throw new Error('Failed to fetch blacklist');
      const data = await response.json();
      setBlacklistEntries(data);
    } catch (error) {
      console.error(error);
    }
  }

  function startOverrideEdit(episode: EpisodeWithLanguage) {
    setEditingUrl(episode.url_website);
    setOverrideForm({
      custom_title: episode.custom_title || '',
      custom_description: episode.custom_description || '',
      custom_language: episode.custom_language || '',
      available_until: episode.available_until || '',
    });
  }

  async function saveOverride(url: string) {
    try {
      const response = await fetch('/api/episode-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url_website: url, ...overrideForm }),
      });
      if (!response.ok) throw new Error('Failed to save override');
      await fetchEpisodes();
      setEditingUrl(null);
    } catch (error) {
      console.error(error);
      alert('Fehler beim Speichern der Overrides');
    }
  }

  async function deleteOverride(id: number | null | undefined) {
    if (!id) return;
    if (!confirm('Override wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/episode-overrides/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete override');
      await fetchEpisodes();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen');
    }
  }

  async function addSearchTerm() {
    if (!newSearchTerm.trim()) return;
    try {
      const response = await fetch('/api/search-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: newSearchTerm.trim() }),
      });
      if (!response.ok) throw new Error('Failed to create search term');
      setNewSearchTerm('');
      await fetchSearchTerms();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Hinzufügen des Suchbegriffs');
    }
  }

  async function updateSearchTerm(id: number) {
    try {
      const response = await fetch(`/api/search-terms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: editingSearchTerm.trim() }),
      });
      if (!response.ok) throw new Error('Failed to update search term');
      setEditingSearchTermId(null);
      setEditingSearchTerm('');
      await fetchSearchTerms();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Aktualisieren');
    }
  }

  async function deleteSearchTerm(id: number) {
    if (!confirm('Suchbegriff wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/search-terms/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete search term');
      await fetchSearchTerms();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen');
    }
  }

  async function addBlacklistEntry() {
    if (!newBlacklist.pattern.trim()) return;
    try {
      const response = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: newBlacklist.pattern.trim(),
          type: newBlacklist.type,
        }),
      });
      if (!response.ok) throw new Error('Failed to create blacklist entry');
      setNewBlacklist({ pattern: '', type: 'title' });
      await fetchBlacklist();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Hinzufügen zur Blacklist');
    }
  }

  async function updateBlacklistEntry(id: number) {
    try {
      const response = await fetch(`/api/blacklist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBlacklist),
      });
      if (!response.ok) throw new Error('Failed to update blacklist entry');
      setEditingBlacklistId(null);
      await fetchBlacklist();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Aktualisieren');
    }
  }

  async function deleteBlacklistEntry(id: number) {
    if (!confirm('Blacklist-Eintrag wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/blacklist/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete blacklist entry');
      await fetchBlacklist();
    } catch (error) {
      console.error(error);
      alert('Fehler beim Löschen');
    }
  }

  const totalOverrides = useMemo(() => episodes.filter(ep => ep.override_id).length, [episodes]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p>Authentifizierung wird geprüft…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-semibold mb-2">Admin Login</h1>
          <p className="text-sm text-slate-400 mb-6">
            Verwende die in der Umgebung hinterlegten Admin-Zugangsdaten.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="username">Benutzername</label>
              <input
                id="username"
                value={loginForm.username}
                onChange={(event) => setLoginForm({ ...loginForm, username: event.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">Passwort</label>
              <input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            {loginError && <p className="text-sm text-rose-400">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-2 bg-emerald-500 text-slate-950 font-semibold rounded-lg hover:bg-emerald-400 transition"
            >
              Anmelden
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">Eingeloggt als {user?.username}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Overrides aktiv: {totalOverrides}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          {(['episodes', 'search-terms', 'blacklist'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full border ${
                activeTab === tab
                  ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                  : 'border-slate-700 text-slate-300 hover:border-slate-500'
              }`}
            >
              {tab === 'episodes' ? 'Episode Overrides' : tab === 'search-terms' ? 'Suchbegriffe' : 'Blacklist'}
            </button>
          ))}
        </div>

        {loading && <p className="text-slate-400">Lade Daten…</p>}

        {!loading && activeTab === 'episodes' && (
          <section className="space-y-4">
            {episodes.map(episode => (
              <div key={episode.url_website} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">{episode.displayTitle}</h2>
                    <p className="text-sm text-slate-400">{episode.displayLanguage} · {episode.url_website}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {episode.override_id && (
                      <span className="text-xs uppercase tracking-wide text-emerald-300 border border-emerald-400/40 px-2 py-1 rounded-full">
                        Override aktiv
                      </span>
                    )}
                    <button
                      onClick={() => startOverrideEdit(episode)}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
                    >
                      Bearbeiten
                    </button>
                    {episode.override_id && (
                      <button
                        onClick={() => deleteOverride(episode.override_id)}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/40 rounded-lg hover:bg-rose-500/20"
                      >
                        Override löschen
                      </button>
                    )}
                  </div>
                </div>

                {editingUrl === episode.url_website && (
                  <div className="mt-4 grid gap-3">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Custom Titel</label>
                      <input
                        value={overrideForm.custom_title}
                        onChange={(event) => setOverrideForm({ ...overrideForm, custom_title: event.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Custom Beschreibung</label>
                      <textarea
                        value={overrideForm.custom_description}
                        onChange={(event) => setOverrideForm({ ...overrideForm, custom_description: event.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                        rows={3}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Custom Sprache</label>
                        <select
                          value={overrideForm.custom_language}
                          onChange={(event) => setOverrideForm({ ...overrideForm, custom_language: event.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                        >
                          <option value="">Auto</option>
                          <option value="Obersorbisch">Obersorbisch</option>
                          <option value="Niedersorbisch">Niedersorbisch</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-300 mb-1">Verfügbar bis</label>
                        <input
                          type="date"
                          value={overrideForm.available_until}
                          onChange={(event) => setOverrideForm({ ...overrideForm, available_until: event.target.value })}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveOverride(episode.url_website)}
                        className="px-4 py-2 bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300"
                      >
                        Speichern
                      </button>
                      <button
                        onClick={() => setEditingUrl(null)}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {!loading && activeTab === 'search-terms' && (
          <section className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-2">ARD API Suchbegriffe</h2>
              <p className="text-sm text-slate-400 mb-4">
                Diese Begriffe werden für die ARD API Anfrage verwendet.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={newSearchTerm}
                  onChange={(event) => setNewSearchTerm(event.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                  placeholder="Neuer Suchbegriff"
                />
                <button
                  onClick={addSearchTerm}
                  className="px-4 py-2 bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300"
                >
                  Hinzufügen
                </button>
              </div>
            </div>

            {searchTerms.map(term => (
              <div key={term.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {editingSearchTermId === term.id ? (
                  <input
                    value={editingSearchTerm}
                    onChange={(event) => setEditingSearchTerm(event.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                  />
                ) : (
                  <span className="text-slate-200">{term.term}</span>
                )}
                <div className="flex gap-2">
                  {editingSearchTermId === term.id ? (
                    <button
                      onClick={() => updateSearchTerm(term.id!)}
                      className="px-3 py-1.5 bg-emerald-400 text-slate-950 rounded-lg"
                    >
                      Speichern
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingSearchTermId(term.id!);
                        setEditingSearchTerm(term.term);
                      }}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      Bearbeiten
                    </button>
                  )}
                  <button
                    onClick={() => deleteSearchTerm(term.id!)}
                    className="px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/40 rounded-lg"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {!loading && activeTab === 'blacklist' && (
          <section className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-lg font-semibold mb-2">Blacklist</h2>
              <p className="text-sm text-slate-400 mb-4">
                Sperre Episoden anhand von Titel- oder URL-Mustern.
              </p>
              <div className="grid md:grid-cols-3 gap-2">
                <input
                  value={newBlacklist.pattern}
                  onChange={(event) => setNewBlacklist({ ...newBlacklist, pattern: event.target.value })}
                  className="md:col-span-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                  placeholder="Muster"
                />
                <select
                  value={newBlacklist.type}
                  onChange={(event) => setNewBlacklist({ ...newBlacklist, type: event.target.value as 'title' | 'url' })}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                >
                  <option value="title">Titel</option>
                  <option value="url">URL</option>
                </select>
              </div>
              <button
                onClick={addBlacklistEntry}
                className="mt-3 px-4 py-2 bg-emerald-400 text-slate-950 rounded-lg hover:bg-emerald-300"
              >
                Hinzufügen
              </button>
            </div>

            {blacklistEntries.map(entry => (
              <div key={entry.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {editingBlacklistId === entry.id ? (
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <input
                      value={editingBlacklist.pattern}
                      onChange={(event) => setEditingBlacklist({ ...editingBlacklist, pattern: event.target.value })}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                    />
                    <select
                      value={editingBlacklist.type}
                      onChange={(event) => setEditingBlacklist({ ...editingBlacklist, type: event.target.value as 'title' | 'url' })}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      <option value="title">Titel</option>
                      <option value="url">URL</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-200">{entry.pattern}</p>
                    <p className="text-xs text-slate-400 uppercase">{entry.type}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  {editingBlacklistId === entry.id ? (
                    <button
                      onClick={() => updateBlacklistEntry(entry.id!)}
                      className="px-3 py-1.5 bg-emerald-400 text-slate-950 rounded-lg"
                    >
                      Speichern
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingBlacklistId(entry.id!);
                        setEditingBlacklist({ pattern: entry.pattern, type: entry.type });
                      }}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      Bearbeiten
                    </button>
                  )}
                  <button
                    onClick={() => deleteBlacklistEntry(entry.id!)}
                    className="px-3 py-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/40 rounded-lg"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
