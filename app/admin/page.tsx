'use client';

import { useEffect, useState } from 'react';
import { EpisodeWithLanguage } from '@/lib/episodes';

interface Keyword {
  id?: number;
  keyword: string;
  created_at?: string;
  updated_at?: string;
}

interface LanguageRule {
  id?: number;
  pattern: string;
  language: string;
  priority: number;
  is_active: number;
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

export default function AdminPage() {
  const [episodes, setEpisodes] = useState<EpisodeWithLanguage[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [languageRules, setLanguageRules] = useState<LanguageRule[]>([]);
  const [blacklistEntries, setBlacklistEntries] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [keywordsLoading, setKeywordsLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [blacklistLoading, setBlacklistLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'episodes' | 'keywords' | 'language-rules' | 'blacklist'>('episodes');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingKeywordId, setEditingKeywordId] = useState<number | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    custom_title: '',
    custom_description: '',
    custom_language: '',
  });
  const [keywordForm, setKeywordForm] = useState({
    keyword: '',
  });
  const [ruleForm, setRuleForm] = useState({
    pattern: '',
    language: 'Obersorbisch',
    priority: 0,
    is_active: true,
  });
  const [blacklistForm, setBlacklistForm] = useState({
    pattern: '',
    type: 'title' as 'title' | 'url',
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [editingBlacklistId, setEditingBlacklistId] = useState<number | null>(null);

  useEffect(() => {
    fetchEpisodes();
    fetchKeywords();
    fetchLanguageRules();
    fetchBlacklist();
  }, []);

  async function fetchEpisodes() {
    try {
      setLoading(true);
      const response = await fetch('/api/episodes');
      if (!response.ok) throw new Error('Failed to fetch episodes');
      const data = await response.json();
      setEpisodes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchKeywords() {
    try {
      setKeywordsLoading(true);
      const response = await fetch('/api/keywords');
      if (!response.ok) throw new Error('Failed to fetch keywords');
      const data = await response.json();
      setKeywords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setKeywordsLoading(false);
    }
  }

  async function fetchLanguageRules() {
    try {
      setRulesLoading(true);
      const response = await fetch('/api/language-rules');
      if (!response.ok) throw new Error('Failed to fetch language rules');
      const data = await response.json();
      setLanguageRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  }

  async function fetchBlacklist() {
    try {
      setBlacklistLoading(true);
      const response = await fetch('/api/blacklist');
      if (!response.ok) throw new Error('Failed to fetch blacklist');
      const data = await response.json();
      setBlacklistEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBlacklistLoading(false);
    }
  }

  async function handleUpdate(id: number) {
    try {
      const response = await fetch(`/api/episodes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) throw new Error('Failed to update');
      await fetchEpisodes();
      setEditingId(null);
      setEditForm({ custom_title: '', custom_description: '', custom_language: '' });
    } catch (err) {
      console.error(err);
      alert('Fehler beim Aktualisieren');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Möchten Sie diese Episode wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/episodes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      await fetchEpisodes();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen');
    }
  }

  function startEdit(episode: EpisodeWithLanguage) {
    setEditingId(episode.id!);
    setEditForm({
      custom_title: episode.custom_title || '',
      custom_description: episode.custom_description || '',
      custom_language: episode.custom_language || '',
    });
  }

  async function handleCreateKeyword() {
    if (!newKeyword.trim()) return;
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create keyword');
      }
      setNewKeyword('');
      await fetchKeywords();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    }
  }

  async function handleUpdateKeyword(id: number) {
    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keywordForm.keyword.trim() }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update keyword');
      }
      await fetchKeywords();
      setEditingKeywordId(null);
      setKeywordForm({ keyword: '' });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    }
  }

  async function handleDeleteKeyword(id: number) {
    if (!confirm('Möchten Sie dieses Schlüsselwort wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/keywords/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete keyword');
      await fetchKeywords();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen');
    }
  }

  function startEditKeyword(keyword: Keyword) {
    setEditingKeywordId(keyword.id!);
    setKeywordForm({ keyword: keyword.keyword });
  }

  async function handleCreateLanguageRule() {
    if (!ruleForm.pattern.trim()) return;
    try {
      const response = await fetch('/api/language-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: ruleForm.pattern.trim(),
          language: ruleForm.language,
          priority: ruleForm.priority,
          is_active: ruleForm.is_active,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create language rule');
      }
      setRuleForm({ pattern: '', language: 'Obersorbisch', priority: 0, is_active: true });
      await fetchLanguageRules();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    }
  }

  async function handleUpdateLanguageRule(id: number) {
    try {
      const response = await fetch(`/api/language-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: ruleForm.pattern.trim(),
          language: ruleForm.language,
          priority: ruleForm.priority,
          is_active: ruleForm.is_active,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update language rule');
      }
      await fetchLanguageRules();
      setEditingRuleId(null);
      setRuleForm({ pattern: '', language: 'Obersorbisch', priority: 0, is_active: true });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    }
  }

  async function handleDeleteLanguageRule(id: number) {
    if (!confirm('Möchten Sie diese Sprachregel wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/language-rules/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete language rule');
      await fetchLanguageRules();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen');
    }
  }

  function startEditLanguageRule(rule: LanguageRule) {
    setEditingRuleId(rule.id!);
    setRuleForm({
      pattern: rule.pattern,
      language: rule.language,
      priority: rule.priority,
      is_active: rule.is_active === 1,
    });
  }

  async function handleClearAllEpisodes() {
    if (!confirm('Möchten Sie wirklich ALLE Episoden löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
      return;
    }
    try {
      const response = await fetch('/api/episodes/clear', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear episodes');
      const data = await response.json();
      alert(`Erfolgreich ${data.deleted} Episode(n) gelöscht.`);
      await fetchEpisodes();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen aller Episoden');
    }
  }

  async function handleCreateBlacklistEntry() {
    if (!blacklistForm.pattern.trim()) return;
    try {
      const response = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: blacklistForm.pattern.trim(),
          type: blacklistForm.type,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create blacklist entry');
      }
      setBlacklistForm({ pattern: '', type: 'title' });
      await fetchBlacklist();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    }
  }

  async function handleUpdateBlacklistEntry(id: number) {
    try {
      const response = await fetch(`/api/blacklist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: blacklistForm.pattern.trim(),
          type: blacklistForm.type,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update blacklist entry');
      }
      await fetchBlacklist();
      setEditingBlacklistId(null);
      setBlacklistForm({ pattern: '', type: 'title' });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Fehler beim Aktualisieren');
    }
  }

  async function handleDeleteBlacklistEntry(id: number) {
    if (!confirm('Möchten Sie diesen Blacklist-Eintrag wirklich löschen?')) return;
    try {
      const response = await fetch(`/api/blacklist/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete blacklist entry');
      await fetchBlacklist();
    } catch (err) {
      console.error(err);
      alert('Fehler beim Löschen');
    }
  }

  function startEditBlacklistEntry(entry: BlacklistEntry) {
    setEditingBlacklistId(entry.id!);
    setBlacklistForm({
      pattern: entry.pattern,
      type: entry.type,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          Admin Panel
        </h1>

        <div className="mb-6 space-x-4">
          <button
            onClick={() => {
              if (activeTab === 'episodes') fetchEpisodes();
              else if (activeTab === 'keywords') fetchKeywords();
              else if (activeTab === 'language-rules') fetchLanguageRules();
              else if (activeTab === 'blacklist') fetchBlacklist();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            {activeTab === 'episodes' && 'Episoden aktualisieren'}
            {activeTab === 'keywords' && 'Schlüsselwörter aktualisieren'}
            {activeTab === 'language-rules' && 'Sprachregeln aktualisieren'}
            {activeTab === 'blacklist' && 'Blacklist aktualisieren'}
          </button>
          {activeTab === 'episodes' && (
            <>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/episodes?sync=true');
                    if (!response.ok) throw new Error('Failed to sync');
                    const result = await response.json();
                    alert(`Erfolgreich ${result.synced} Episode(n) synchronisiert.`);
                    await fetchEpisodes();
                  } catch (err) {
                    console.error(err);
                    alert('Fehler beim Synchronisieren');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Von API synchronisieren
              </button>
              <button
                onClick={handleClearAllEpisodes}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Alle Episoden löschen
              </button>
            </>
          )}
          <a
            href="/"
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg inline-block"
          >
            Zur Hauptseite
          </a>
        </div>

        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('episodes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'episodes'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Episoden
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'keywords'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Schlüsselwörter
            </button>
            <button
              onClick={() => setActiveTab('language-rules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'language-rules'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Sprachregeln
            </button>
            <button
              onClick={() => setActiveTab('blacklist')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'blacklist'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Blacklist
            </button>
          </nav>
        </div>

        {activeTab === 'keywords' && (
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Neues Schlüsselwort hinzufügen
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateKeyword()}
                  placeholder="Schlüsselwort eingeben..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <button
                  onClick={handleCreateKeyword}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          <>
            {keywordsLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Lade Schlüsselwörter…</p>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Schlüsselwort
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {keywords.map(keyword => (
                      <tr key={keyword.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingKeywordId === keyword.id ? (
                            <input
                              type="text"
                              value={keywordForm.keyword}
                              onChange={(e) => setKeywordForm({ keyword: e.target.value })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {keyword.keyword}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingKeywordId === keyword.id ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleUpdateKeyword(keyword.id!)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => {
                                  setEditingKeywordId(null);
                                  setKeywordForm({ keyword: '' });
                                }}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <div className="space-x-2">
                              <button
                                onClick={() => startEditKeyword(keyword)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                              >
                                Bearbeiten
                              </button>
                              <button
                                onClick={() => handleDeleteKeyword(keyword.id!)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400"
                              >
                                Löschen
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'language-rules' && (
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Neue Sprachregel hinzufügen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={ruleForm.pattern}
                  onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                  placeholder="Muster (z.B. 'niedersorbisch')"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <select
                  value={ruleForm.language}
                  onChange={(e) => setRuleForm({ ...ruleForm, language: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="Obersorbisch">Obersorbisch</option>
                  <option value="Niedersorbisch">Niedersorbisch</option>
                </select>
                <input
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 0 })}
                  placeholder="Priorität (niedrigere = früher)"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={ruleForm.is_active}
                      onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })}
                      className="rounded"
                    />
                    Aktiv
                  </label>
                  <button
                    onClick={handleCreateLanguageRule}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                  >
                    Hinzufügen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'language-rules' && (
          <>
            {rulesLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Lade Sprachregeln…</p>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Muster
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Sprache
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Priorität
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {languageRules.map(rule => (
                      <tr key={rule.id} className={rule.is_active === 0 ? 'opacity-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRuleId === rule.id ? (
                            <input
                              type="text"
                              value={ruleForm.pattern}
                              onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {rule.pattern}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRuleId === rule.id ? (
                            <select
                              value={ruleForm.language}
                              onChange={(e) => setRuleForm({ ...ruleForm, language: e.target.value })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                            >
                              <option value="Obersorbisch">Obersorbisch</option>
                              <option value="Niedersorbisch">Niedersorbisch</option>
                            </select>
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {rule.language}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRuleId === rule.id ? (
                            <input
                              type="number"
                              value={ruleForm.priority}
                              onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {rule.priority}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingRuleId === rule.id ? (
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={ruleForm.is_active}
                                onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })}
                                className="rounded"
                              />
                              Aktiv
                            </label>
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {rule.is_active === 1 ? '✓ Aktiv' : '✗ Inaktiv'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingRuleId === rule.id ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleUpdateLanguageRule(rule.id!)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => {
                                  setEditingRuleId(null);
                                  setRuleForm({ pattern: '', language: 'Obersorbisch', priority: 0, is_active: true });
                                }}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <div className="space-x-2">
                              <button
                                onClick={() => startEditLanguageRule(rule)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                              >
                                Bearbeiten
                              </button>
                              <button
                                onClick={() => handleDeleteLanguageRule(rule.id!)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400"
                              >
                                Löschen
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'episodes' && (
          <>
            {loading ? (
              <p className="text-gray-600 dark:text-gray-400">Lade Episoden…</p>
            ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Titel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Sprache
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {episodes.map(episode => (
                  <tr key={episode.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === episode.id ? (
                        <input
                          type="text"
                          value={editForm.custom_title}
                          onChange={(e) => setEditForm({ ...editForm, custom_title: e.target.value })}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                          placeholder={episode.original_title || 'Titel'}
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {episode.displayTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === episode.id ? (
                        <select
                          value={editForm.custom_language}
                          onChange={(e) => setEditForm({ ...editForm, custom_language: e.target.value })}
                          className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                        >
                          <option value="">Auto</option>
                          <option value="Obersorbisch">Obersorbisch</option>
                          <option value="Niedersorbisch">Niedersorbisch</option>
                        </select>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {episode.displayLanguage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {episode.timestamp
                        ? new Date(episode.timestamp * 1000).toLocaleDateString('de-DE')
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === episode.id ? (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleUpdate(episode.id!)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                          >
                            Speichern
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({ custom_title: '', custom_description: '', custom_language: '' });
                            }}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <div className="space-x-2">
                          <button
                            onClick={() => startEdit(episode)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleDelete(episode.id!)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
                          >
                            Löschen
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </>
        )}

        {activeTab === 'blacklist' && (
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                Neuen Blacklist-Eintrag hinzufügen
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={blacklistForm.pattern}
                  onChange={(e) => setBlacklistForm({ ...blacklistForm, pattern: e.target.value })}
                  placeholder="Muster (z.B. 'unwanted title' oder 'mdr.de/video-123')"
                  className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
                <select
                  value={blacklistForm.type}
                  onChange={(e) => setBlacklistForm({ ...blacklistForm, type: e.target.value as 'title' | 'url' })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="title">Titel</option>
                  <option value="url">URL</option>
                </select>
                <button
                  onClick={handleCreateBlacklistEntry}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Hinzufügen
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blacklist' && (
          <>
            {blacklistLoading ? (
              <p className="text-gray-600 dark:text-gray-400">Lade Blacklist…</p>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Muster
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Typ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {blacklistEntries.map(entry => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingBlacklistId === entry.id ? (
                            <input
                              type="text"
                              value={blacklistForm.pattern}
                              onChange={(e) => setBlacklistForm({ ...blacklistForm, pattern: e.target.value })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {entry.pattern}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingBlacklistId === entry.id ? (
                            <select
                              value={blacklistForm.type}
                              onChange={(e) => setBlacklistForm({ ...blacklistForm, type: e.target.value as 'title' | 'url' })}
                              className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                            >
                              <option value="title">Titel</option>
                              <option value="url">URL</option>
                            </select>
                          ) : (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {entry.type === 'title' ? 'Titel' : 'URL'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingBlacklistId === entry.id ? (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleUpdateBlacklistEntry(entry.id!)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => {
                                  setEditingBlacklistId(null);
                                  setBlacklistForm({ pattern: '', type: 'title' });
                                }}
                                className="text-gray-600 hover:text-gray-900 dark:text-gray-400"
                              >
                                Abbrechen
                              </button>
                            </div>
                          ) : (
                            <div className="space-x-2">
                              <button
                                onClick={() => startEditBlacklistEntry(entry)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                              >
                                Bearbeiten
                              </button>
                              <button
                                onClick={() => handleDeleteBlacklistEntry(entry.id!)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400"
                              >
                                Löschen
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

