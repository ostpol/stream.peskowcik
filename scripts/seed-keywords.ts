import { getDb, closeDb } from '../lib/db';

// Default keywords from the original Python code
const DEFAULT_KEYWORDS = [
  'sorbisch',
  'obersorbisch',
  'niedersorbisch',
  'peskowcik',
  'pěskowčik',
  'gestörte angelfreuden',
  'gestoerte angelfreuden',
  'suwa',
  'spewaca',
  'mróčele',
  'mrocele',
  'jablucina',
  'jabłucina',
  'liska',
  'sroka',
];

async function seedKeywords() {
  console.log('Starting keyword seed...');
  const db = getDb();

  for (const keyword of DEFAULT_KEYWORDS) {
    try {
      // Check if keyword already exists (case-insensitive)
      const existing = db.prepare('SELECT id FROM keywords WHERE LOWER(keyword) = LOWER(?)').get(keyword);
      
      if (!existing) {
        db.prepare('INSERT INTO keywords (keyword) VALUES (?)').run(keyword);
        console.log(`✓ Seeded keyword: ${keyword}`);
      } else {
        console.log(`- Keyword already exists: ${keyword}`);
      }
    } catch (error) {
      console.error(`✗ Failed to seed keyword ${keyword}:`, error);
    }
  }

  console.log('\nKeyword seed completed!');
  closeDb();
}

seedKeywords().catch(console.error);

