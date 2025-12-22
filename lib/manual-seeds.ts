import { getDb } from './db';
import { ManualSeed } from './db';
import { createOrUpdateEpisode } from './episodes';
import { extractBase64Id, fetchArdEpisode } from './api-client';

export interface ManualSeedInput {
  kind: 'base64' | 'url';
  value: string;
  custom_title?: string | null;
  custom_description?: string | null;
  custom_date?: string | null;
}

export async function getAllManualSeeds(): Promise<ManualSeed[]> {
  const db = getDb();
  return db.prepare('SELECT * FROM manual_seeds ORDER BY created_at DESC').all() as ManualSeed[];
}

export async function createManualSeed(input: ManualSeedInput): Promise<ManualSeed> {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO manual_seeds (kind, value, custom_title, custom_description, custom_date)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    input.kind,
    input.value,
    input.custom_title ?? null,
    input.custom_description ?? null,
    input.custom_date ?? null
  );
  return db.prepare('SELECT * FROM manual_seeds WHERE value = ?').get(input.value) as ManualSeed;
}

export async function updateManualSeed(id: number, input: ManualSeedInput): Promise<ManualSeed | null> {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE manual_seeds
    SET kind = ?,
        value = ?,
        custom_title = ?,
        custom_description = ?,
        custom_date = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(
    input.kind,
    input.value,
    input.custom_title ?? null,
    input.custom_description ?? null,
    input.custom_date ?? null,
    id
  );
  return db.prepare('SELECT * FROM manual_seeds WHERE id = ?').get(id) as ManualSeed | undefined || null;
}

export async function deleteManualSeed(id: number): Promise<boolean> {
  const db = getDb();
  const result = db.prepare('DELETE FROM manual_seeds WHERE id = ?').run(id);
  return result.changes > 0;
}

function parseDateInput(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const parsed = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.floor(parsed.getTime() / 1000);
}

export async function seedManualSeeds(): Promise<{ seeded: number; failed: number }> {
  const seeds = await getAllManualSeeds();
  let seeded = 0;
  let failed = 0;

  for (const seed of seeds) {
    try {
      if (seed.kind === 'base64') {
        const ardData = await fetchArdEpisode(seed.value);
        if (!ardData) {
          failed++;
          continue;
        }

        const timestampOverride = parseDateInput(seed.custom_date);
        await createOrUpdateEpisode(ardData.url_website, {
          base64_id: seed.value,
          url_video: ardData.url_video || null,
          original_title: ardData.title,
          original_description: ardData.description,
          timestamp: timestampOverride ?? ardData.timestamp,
          duration: ardData.duration || null,
          channel: ardData.channel || null,
          is_manual: 1,
          custom_title: seed.custom_title ?? null,
          custom_description: seed.custom_description ?? null,
        });
        seeded++;
        continue;
      }

      const base64Id = extractBase64Id(seed.value);
      let episodeData: any = {
        is_manual: 1,
      };

      if (base64Id) {
        const ardData = await fetchArdEpisode(base64Id);
        if (ardData) {
          episodeData = {
            ...episodeData,
            base64_id: base64Id,
            original_title: ardData.title,
            original_description: ardData.description,
            timestamp: ardData.timestamp,
            duration: ardData.duration || null,
            channel: ardData.channel || null,
            url_video: ardData.url_video || null,
          };
        }
      }

      const timestampOverride = parseDateInput(seed.custom_date);
      if (timestampOverride) {
        episodeData.timestamp = timestampOverride;
      }
      if (seed.custom_title) {
        episodeData.custom_title = seed.custom_title;
      }
      if (seed.custom_description) {
        episodeData.custom_description = seed.custom_description;
      }

      await createOrUpdateEpisode(seed.value, episodeData);
      seeded++;
    } catch (error) {
      console.error('Failed to seed manual entry:', seed.value, error);
      failed++;
    }
  }

  return { seeded, failed };
}
