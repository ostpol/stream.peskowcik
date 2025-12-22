import { getDb, closeDb } from '../lib/db';

// Default language rules from the original Python code
const DEFAULT_RULES = [
  { pattern: 'niedersorbisch', language: 'Niedersorbisch', priority: 0 },
  { pattern: 'obersorbisch', language: 'Obersorbisch', priority: 1 },
  { pattern: 'sorbisch', language: 'Obersorbisch', priority: 2 }, // Default to Obersorbisch for generic "sorbisch"
  { pattern: 'pěskowčik', language: 'Obersorbisch', priority: 3 },
  { pattern: 'peskowcik', language: 'Obersorbisch', priority: 4 },
  { pattern: 'nas peskowy', language: 'Niedersorbisch', priority: 5 },
  { pattern: 'naš pěskowy', language: 'Niedersorbisch', priority: 6 },
];

async function seedLanguageRules() {
  console.log('Starting language rules seed...');
  const db = getDb();

  for (const rule of DEFAULT_RULES) {
    try {
      // Check if rule already exists (same pattern, case-insensitive)
      const existing = db.prepare('SELECT id FROM language_rules WHERE LOWER(pattern) = LOWER(?)').get(rule.pattern);
      
      if (!existing) {
        db.prepare(`
          INSERT INTO language_rules (pattern, language, priority, is_active) 
          VALUES (?, ?, ?, 1)
        `).run(rule.pattern, rule.language, rule.priority);
        console.log(`✓ Seeded rule: ${rule.pattern} -> ${rule.language} (priority ${rule.priority})`);
      } else {
        console.log(`- Rule already exists: ${rule.pattern}`);
      }
    } catch (error) {
      console.error(`✗ Failed to seed rule ${rule.pattern}:`, error);
    }
  }

  console.log('\nLanguage rules seed completed!');
  closeDb();
}

seedLanguageRules().catch(console.error);

