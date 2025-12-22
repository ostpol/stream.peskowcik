import { getDb, closeDb } from '../lib/db';
import { fetchArdEpisode, extractBase64Id } from '../lib/api-client';
import { createOrUpdateEpisode } from '../lib/episodes';

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

// Manual episodes from the original Python code
const MANUAL_EPISODES = [
  'Y3JpZDovL3JiYl8wMjk5OTNlZS1kOTI4LTRmNjUtYTMzNy00Y2U0MzA4ZDBjMjRfcHVibGljYXRpb24',
  'Y3JpZDovL3JiYl8xNDYwZDFhZS1hYTBkLTQ5YjctYTRlYy1kZDZiOWVmNjI1OWRfcHVibGljYXRpb24',
  'Y3JpZDovL3JiYl80MzU4NjU4Ny1jZDk3LTQ4MTEtYWFkNS05YWMzYmJjZWY3OGVfcHVibGljYXRpb24',
  'Y3JpZDovL3JiYl9kNGU3YTc0Mi1jYzEzLTRjNTYtYjVkYS01OWQ5MmFkZjJjZDlfcHVibGljYXRpb24',
  'Y3JpZDovL3JiYl84OWJjODc4Mi01MWYwLTQ2NzgtYmM5MC1mYzIxMzNkOTIyOWFfcHVibGljYXRpb24',
  'Y3JpZDovL3JiYl80MDE1ZGU4MS01ZjQwLTRhOWItYjdlNi1kZTQ3ZGU2M2Y5MTVfcHVibGljYXRpb24',
  'Y3JpZDovL3JiYl81NTY3M2M5Zi01YjAyLTQ5OTQtOTI1Ny1lMjk5MjdlMjNhNjZfcHVibGljYXRpb24',
];

const MANUAL_EPISODE_URLS = [
  'https://www.mdr.de/sandmann/video-536936.html',
  'https://www.mdr.de/sandmann/video-529286.html',
  'https://www.mdr.de/sandmann/video-529344.html',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/peskowcik-liska-a-sroka-jablucina-oder-unser-sandmaennchen-sorbisch-oder-17-08-2025/rbb/Y3JpZDovL3JiYl9iNmY2MWU1ZC02NDdkLTQ2ZjQtYjYzNC0wY2JkOTM5NzYwOTdfcHVibGljYXRpb24',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/peskowcik-liska-a-sroka-prekwapjenka-za-knjeni-sroku-oder-unser-sandmaennchen-sorbisch-oder-03-08-2025/rbb/Y3JpZDovL3JiYl82NjM2ZDcxZS0zYzZjLTRjYTUtOGI1ZS0yNjc0OTQxMjQ0ZWZfcHVibGljYXRpb24',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/peskowcik-kito-maja-a-potajna-krinja-wo-dziwjej-zonje-a-zlotym-liscu-oder-unser-sandmaennchen-obersorbisch-oder-02-11-2025/rbb/Y3JpZDovL3JiYl8zZDIxODZiYi00YWU3LTQwNDQtOTYyMC1lNGQ4Yzg4MzYzMzVfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/nas-peskowy-muzyk-kito-maja-a-kista-cowankow-wo-ziwej-zenskej-a-zlotem-jagnjesu-oder-unser-sandmaennchen-niedersorbisch-oder-02-11-2025/rbb/Y3JpZDovL3JiYl81NjYzZjE5NS00MzQ4LTQzNTktYmRmNy0xYjIxN2M5NzI1ZWJfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/peskowcik-kito-maja-a-potajna-krinja-wo-wodnym-muzu-a-kak-je-pomhac-chcyl-oder-unser-sandmaennchen-obersorbisch-oder-26-10-2025/rbb/Y3JpZDovL3JiYl8xZjJlZmQ2Ni05NDg4LTQ0MmEtYWIzNC01YjIwM2ExMTdhMmJfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/nas-peskowy-muzyk-kito-maja-a-kista-cowankow-wo-wodnem-muzu-a-kak-jo-won-ksel-pomagas-oder-unser-sandmaennchen-niedersorbisch-oder-26-10-2025/rbb/Y3JpZDovL3JiYl8wYWYwMzg5MS1lMjM1LTQ0OWQtYTA0Mi0xNTIzNDFkNDY5MjFfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/peskowcik-kito-maja-a-potajna-krinja-wo-hobrje-sprjewniku-a-kak-so-sprjewja-wuzorli-oder-unser-sandmaennchen-obersorbisch-oder-19-10-2025/rbb/Y3JpZDovL3JiYl84ZDhlNDllOS0yNTJlLTQxNTUtYTRjYy03NGUwY2Y4NGU4M2RfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/nas-peskowy-muzyk-kito-maja-a-kista-cowankow-wo-wjelikanje-sprjejniku-a-sprjewi-oder-unser-sandmaennchen-niedersorbisch-oder-19-10-2025/rbb/Y3JpZDovL3JiYl9hYmEwNjhmMS0wYjg0LTQ1ZGQtOGJhZi1iNWI3ZmRkMzg2NzBfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/peskowcik-kito-maja-a-potajna-krinja-wo-cerciku-a-kak-stej-jemu-wolaj-ceknyloj-oder-unser-sandmaennchen-obersorbisch-oder-12-10-2025/rbb/Y3JpZDovL3JiYl84ZDg4NTViZi1mMGFjLTRlZDEtODNkNC0zZTdjMjFkMzA5OWNfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/nas-peskowy-muzyk-kito-maja-a-kista-cowankow-wo-carsiku-a-jogo-wub-gnjonych-wolach-oder-unser-sandmaennchen-niedersorbisch-oder-12-10-2025/rbb/Y3JpZDovL3JiYl9lY2I0NTA2Mi1kMTY3LTQ2YzktYWI4YS1hOTVlODlmM2RhNmNfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/peskowcik-kito-maja-a-potajna-krinja-wo-zmiju-a-kak-jeho-zaso-wotbudzes-oder-unser-sandmaennchen-obersorbisch-oder-05-10-2025/rbb/Y3JpZDovL3JiYl8xYzI0MTNiZC1lMWZjLTRlOTQtYWNkNy1lNDE3ZDViNjBiMTNfcHVibGljYXRpb24?isChildContent',
  'https://www.ardmediathek.de/video/unser-sandmaennchen/nas-peskowy-muzyk-kito-maja-a-kista-cowankow-wo-plonje-a-kak-se-mozos-jogo-zasej-wobijas-oder-unser-sandmaennchen-niedersorbisch-oder-05-10-2025/rbb/Y3JpZDovL3JiYl9jOWQ2MzNkYS03MGE1LTRkMDQtOWU1NS1kZmM4YWYyNjhkY2JfcHVibGljYXRpb24?isChildContent',
];

const MANUAL_EPISODE_METADATA: Record<string, { title: string; description: string; date: string }> = {
  'https://www.mdr.de/sandmann/video-536936.html': {
    title: 'Pěskowčik: Kalli chce być myška',
    description: 'Kalli njemóže sej zaso raz wusnyć! Tónraz stanie so z myšku, dokelž tak rady twarožk rymza.',
    date: '22.08.2021',
  },
  'https://www.mdr.de/sandmann/video-529286.html': {
    title: 'Pěskowčik: Pirat Kalli so hněwa',
    description: 'Kalli chce pirat być, tola Mareike je jemu tutu ideju skazyła. Naraz stanie so wón samo z kapitanom wulkeje łódźe a hižo wubědźowanje startuje.',
    date: '25.07.2021',
  },
  'https://www.mdr.de/sandmann/video-529344.html': {
    title: 'Pěskowčik: Kalli a wobraz za Mareiku',
    description: 'Kalli njemóže sej zaso raz wusnyć. Tónraz je módry krokodil namolował a chce so ze seršćowcom stać. Kalli chce mjenujcy swět pisaniši sčinić.',
    date: '11.07.2021',
  },
};

function parseDate(dateStr: string): number {
  try {
    const [day, month, year] = dateStr.split('.');
    const dt = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    return Math.floor(dt.getTime() / 1000);
  } catch {
    return 0;
  }
}

async function seed() {
  console.log('Starting database seed...');
  const db = getDb(); // Initialize database

  // Seed keywords first
  console.log(`\nSeeding ${DEFAULT_KEYWORDS.length} default keywords...`);
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

  // Seed language rules
  const DEFAULT_LANGUAGE_RULES = [
    { pattern: 'niedersorbisch', language: 'Niedersorbisch', priority: 0 },
    { pattern: 'obersorbisch', language: 'Obersorbisch', priority: 1 },
    { pattern: 'sorbisch', language: 'Obersorbisch', priority: 2 },
    { pattern: 'pěskowčik', language: 'Obersorbisch', priority: 3 },
    { pattern: 'peskowcik', language: 'Obersorbisch', priority: 4 },
    { pattern: 'nas peskowy', language: 'Niedersorbisch', priority: 5 },
    { pattern: 'naš pěskowy', language: 'Niedersorbisch', priority: 6 },
  ];
  
  console.log(`\nSeeding ${DEFAULT_LANGUAGE_RULES.length} default language rules...`);
  for (const rule of DEFAULT_LANGUAGE_RULES) {
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

  // Seed manual episodes from base64 IDs
  console.log(`\nSeeding ${MANUAL_EPISODES.length} manual episodes from base64 IDs...`);
  for (const base64Id of MANUAL_EPISODES) {
    try {
      const ardData = await fetchArdEpisode(base64Id);
      if (ardData) {
        await createOrUpdateEpisode(ardData.url_website, {
          base64_id: base64Id,
          url_video: ardData.url_video || null,
          original_title: ardData.title,
          original_description: ardData.description,
          timestamp: ardData.timestamp,
          duration: ardData.duration || null,
          channel: ardData.channel || null,
          is_manual: 1,
        });
        console.log(`✓ Seeded: ${ardData.title}`);
      }
    } catch (error) {
      console.error(`✗ Failed to seed ${base64Id}:`, error);
    }
  }

  // Seed manual episodes from URLs
  console.log(`\nSeeding ${MANUAL_EPISODE_URLS.length} manual episodes from URLs...`);
  for (const url of MANUAL_EPISODE_URLS) {
    try {
      const base64Id = extractBase64Id(url);
      const meta = MANUAL_EPISODE_METADATA[url];
      
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

      if (meta) {
        episodeData.custom_title = meta.title;
        episodeData.custom_description = meta.description;
        episodeData.timestamp = parseDate(meta.date) || episodeData.timestamp;
      }

      await createOrUpdateEpisode(url, episodeData);
      console.log(`✓ Seeded: ${meta?.title || url}`);
    } catch (error) {
      console.error(`✗ Failed to seed ${url}:`, error);
    }
  }

  console.log('\nSeed completed!');
  closeDb();
}

seed().catch(console.error);

