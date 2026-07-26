import "dotenv/config";
import { Client } from "pg";

const seedCategories = [
  { id: "nature", icon: "trees", color: "#2f8f8a", en: "Nature", ru: "Природа", ja: "自然" },
  { id: "temples", icon: "church", color: "#d1495b", en: "Temples & Religion", ru: "Храмы и религия", ja: "寺院・宗教" },
  { id: "castles", icon: "castle", color: "#a4694a", en: "Castles & Palaces", ru: "Замки и дворцы", ja: "城・宮殿" },
  { id: "museums", icon: "university", color: "#6b5b95", en: "Museums & Art", ru: "Музеи и искусство", ja: "博物館・美術" },
  { id: "urban", icon: "building", color: "#5b6ee1", en: "Urban Environment", ru: "Городская среда", ja: "街並み" },
  { id: "viewpoints", icon: "eye", color: "#e0a13e", en: "Viewpoints", ru: "Смотровые площадки", ja: "展望スポット" },
  { id: "entertainment", icon: "ferris-wheel", color: "#c1440e", en: "Entertainment", ru: "Развлечения", ja: "エンターテインメント" },
  { id: "gardens", icon: "flower", color: "#4c9a63", en: "Gardens & Parks", ru: "Сады и парки", ja: "庭園・公園" },
  { id: "monuments", icon: "landmark", color: "#8a7355", en: "Monuments & Memorials", ru: "Памятники и мемориалы", ja: "記念碑・慰霊碑" },
  { id: "unique", icon: "gem", color: "#b5651d", en: "Unique Places", ru: "Уникальные места", ja: "ユニークな場所" }
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    for (const [index, category] of seedCategories.entries()) {
      await client.query(
        `INSERT INTO "Category" (id, position, name, "nameByLanguage", icon, color, "isHidden")
         VALUES ($1, $2, $3, $4, $5, $6, false)
         ON CONFLICT (id) DO NOTHING`,
        [category.id, index, category.ru, JSON.stringify({ en: category.en, ru: category.ru, ja: category.ja }), category.icon, category.color]
      );
      console.log(`Seeded category "${category.id}".`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
