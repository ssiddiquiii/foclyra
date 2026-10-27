import { db } from './FoclyraDB';

export function createBootstrapController({ openDatabase, seedDatabase }) {
  let bootstrapPromise = null;

  const bootstrap = () => {
    if (!bootstrapPromise) {
      bootstrapPromise = Promise.resolve()
        .then(() => openDatabase())
        .then(() => seedDatabase())
        .catch((error) => {
          bootstrapPromise = null;
          throw error;
        });
    }
    return bootstrapPromise;
  };

  const retry = () => {
    bootstrapPromise = null;
    return bootstrap();
  };

  return { bootstrap, retry };
}

const appBootstrap = createBootstrapController({
  openDatabase: () => db.open(),
  seedDatabase: () => db.seedIfEmpty()
});

export const bootstrapApp = appBootstrap.bootstrap;
export const retryBootstrap = appBootstrap.retry;
