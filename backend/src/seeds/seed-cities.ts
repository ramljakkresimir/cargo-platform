import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { City } from '../cities/city.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CITIES: Omit<City, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // ── Croatia ──────────────────────────────────────────────────────────
  { name: 'Zagreb',          country: 'HR', region: 'Grad Zagreb',             latitude: 45.8150, longitude: 15.9819 },
  { name: 'Split',           country: 'HR', region: 'Splitsko-dalmatinska',     latitude: 43.5081, longitude: 16.4402 },
  { name: 'Rijeka',          country: 'HR', region: 'Primorsko-goranska',       latitude: 45.3271, longitude: 14.4422 },
  { name: 'Osijek',          country: 'HR', region: 'Osječko-baranjska',        latitude: 45.5511, longitude: 18.6939 },
  { name: 'Slavonski Brod',  country: 'HR', region: 'Brodsko-posavska',         latitude: 45.1600, longitude: 18.0156 },
  { name: 'Đakovo',          country: 'HR', region: 'Osječko-baranjska',        latitude: 45.3089, longitude: 18.4106 },
  { name: 'Vinkovci',        country: 'HR', region: 'Vukovarsko-srijemska',     latitude: 45.2881, longitude: 18.8036 },
  { name: 'Vukovar',         country: 'HR', region: 'Vukovarsko-srijemska',     latitude: 45.3519, longitude: 18.9989 },
  { name: 'Karlovac',        country: 'HR', region: 'Karlovačka',              latitude: 45.4929, longitude: 15.5500 },
  { name: 'Varaždin',        country: 'HR', region: 'Varaždinska',             latitude: 46.3044, longitude: 16.3378 },
  { name: 'Zadar',           country: 'HR', region: 'Zadarska',                latitude: 44.1194, longitude: 15.2314 },
  { name: 'Šibenik',         country: 'HR', region: 'Šibensko-kninska',        latitude: 43.7350, longitude: 15.8952 },
  { name: 'Dubrovnik',       country: 'HR', region: 'Dubrovačko-neretvanska',  latitude: 42.6507, longitude: 18.0944 },
  { name: 'Pula',            country: 'HR', region: 'Istarska',                latitude: 44.8683, longitude: 13.8481 },
  { name: 'Kutina',          country: 'HR', region: 'Sisačko-moslavačka',      latitude: 45.4742, longitude: 16.7753 },
  { name: 'Nova Gradiška',   country: 'HR', region: 'Brodsko-posavska',         latitude: 45.2547, longitude: 17.3817 },
  { name: 'Sisak',           country: 'HR', region: 'Sisačko-moslavačka',      latitude: 45.4667, longitude: 16.3667 },
  { name: 'Petrinja',        country: 'HR', region: 'Sisačko-moslavačka',      latitude: 45.4422, longitude: 16.2789 },
  { name: 'Bjelovar',        country: 'HR', region: 'Bjelovarsko-bilogorska',  latitude: 45.8989, longitude: 16.8483 },
  { name: 'Koprivnica',      country: 'HR', region: 'Koprivničko-križevačka',  latitude: 46.1639, longitude: 16.8319 },
  { name: 'Čakovec',         country: 'HR', region: 'Međimurska',              latitude: 46.3839, longitude: 16.4336 },
  { name: 'Gospić',          country: 'HR', region: 'Ličko-senjska',           latitude: 44.5467, longitude: 15.3742 },
  { name: 'Požega',          country: 'HR', region: 'Požeško-slavonska',       latitude: 45.3400, longitude: 17.6858 },
  { name: 'Virovitica',      country: 'HR', region: 'Virovitičko-podravska',   latitude: 45.8319, longitude: 17.3833 },

  // ── Bosnia and Herzegovina ────────────────────────────────────────────
  { name: 'Sarajevo',        country: 'BA', region: 'Kanton Sarajevo',          latitude: 43.8519, longitude: 18.3866 },
  { name: 'Mostar',          country: 'BA', region: 'Hercegovina-Neretva',      latitude: 43.3436, longitude: 17.8081 },
  { name: 'Banja Luka',      country: 'BA', region: 'Republika Srpska',         latitude: 44.7722, longitude: 17.1910 },
  { name: 'Tuzla',           country: 'BA', region: 'Tuzlanski kanton',         latitude: 44.5382, longitude: 18.6734 },
  { name: 'Zenica',          country: 'BA', region: 'Zeničko-dobojski kanton',  latitude: 44.2028, longitude: 17.9075 },
  { name: 'Doboj',           country: 'BA', region: 'Republika Srpska',         latitude: 44.7314, longitude: 18.0869 },
  { name: 'Bijeljina',       country: 'BA', region: 'Republika Srpska',         latitude: 44.7556, longitude: 19.2142 },
  { name: 'Bihać',           country: 'BA', region: 'Unsko-sanski kanton',      latitude: 44.8167, longitude: 15.8681 },
  { name: 'Travnik',         country: 'BA', region: 'Srednjobosanski kanton',   latitude: 44.2261, longitude: 17.6636 },
  { name: 'Jajce',           country: 'BA', region: 'Srednjobosanski kanton',   latitude: 44.3411, longitude: 17.2681 },
  { name: 'Konjic',          country: 'BA', region: 'Hercegovina-Neretva',      latitude: 43.6511, longitude: 17.9608 },
  { name: 'Jablanica',       country: 'BA', region: 'Hercegovina-Neretva',      latitude: 43.6583, longitude: 17.7556 },
  { name: 'Žepče',           country: 'BA', region: 'Zeničko-dobojski kanton',  latitude: 44.4286, longitude: 18.0411 },
  { name: 'Tešanj',          country: 'BA', region: 'Zeničko-dobojski kanton',  latitude: 44.6119, longitude: 17.9889 },
  { name: 'Gradiška',        country: 'BA', region: 'Republika Srpska',         latitude: 45.1519, longitude: 17.2539 },
  { name: 'Brčko',           country: 'BA', region: 'Distrikt Brčko',           latitude: 44.8706, longitude: 18.8103 },
  { name: 'Livno',           country: 'BA', region: 'Kanton 10',                latitude: 43.8275, longitude: 17.0083 },
  { name: 'Cazin',           country: 'BA', region: 'Unsko-sanski kanton',      latitude: 44.9669, longitude: 15.9453 },
  { name: 'Široki Brijeg',   country: 'BA', region: 'Zapadnohercegovački kanton', latitude: 43.3839, longitude: 17.5939 },
  { name: 'Prijedor',        country: 'BA', region: 'Republika Srpska',         latitude: 44.9797, longitude: 16.7147 },
  { name: 'Zvornik',         country: 'BA', region: 'Republika Srpska',         latitude: 44.3861, longitude: 19.1019 },
  { name: 'Kakanj',          country: 'BA', region: 'Zeničko-dobojski kanton',  latitude: 44.1286, longitude: 18.1139 },
  { name: 'Visoko',          country: 'BA', region: 'Zeničko-dobojski kanton',  latitude: 44.0000, longitude: 18.1783 },
  { name: 'Kiseljak',        country: 'BA', region: 'Središnja Bosna',          latitude: 43.9411, longitude: 18.0783 },
  { name: 'Vitez',           country: 'BA', region: 'Središnja Bosna',          latitude: 44.1581, longitude: 17.7878 },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'cargo_app',
    entities: [City],
    synchronize: true,
  });

  await dataSource.initialize();

  const repo = dataSource.getRepository(City);
  let inserted = 0;
  let skipped = 0;

  for (const city of CITIES) {
    const exists = await repo.findOne({
      where: { name: city.name, country: city.country },
    });
    if (exists) {
      skipped++;
    } else {
      await repo.save(repo.create(city));
      inserted++;
    }
  }

  await dataSource.destroy();
  console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped (already exist).`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
