import createApp from './app';
import { env } from './config/env';
import { logger } from './shared/utils';
import { connectDatabase } from './shared/database';
// Importar modelos para inicializar relaciones
import './shared/database/models';

const startServer = async (): Promise<void> => {
  try {
    // Conectar a la base de datos
    await connectDatabase();

    const app = createApp();

    // Iniciar servidor
    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API Version: ${env.API_VERSION}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

