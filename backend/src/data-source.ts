import 'dotenv/config';
import { DataSource } from 'typeorm';
import { entities } from './entities';

// CLI-only DataSource (migration:generate / migration:run / migration:revert).
// Kept separate from AppModule's TypeOrmModule.forRootAsync because the TypeORM
// CLI can't resolve a connection out of Nest's dependency-injected ConfigService —
// it needs a plain, directly-exported DataSource instance instead. Shares the same
// `entities` list as AppModule (./entities.ts) so the two can't drift out of sync.
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  // Never used for the CLI connection — migrations are the schema source of truth here.
  synchronize: false,
});
