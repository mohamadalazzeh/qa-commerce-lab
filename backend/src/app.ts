import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';

import { logger } from './infrastructure/logging/logger.js';
import { openApiDocument } from './openapi/openapi.js';
import { authRouter } from './modules/auth/auth.module.js';
import { errorHandler } from './shared/http/error-handler.js';
import { notFoundHandler } from './shared/http/not-found.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'qa-commerce-lab-backend',
  });
});

app.get('/openapi.json', (_request, response) => {
  response.status(200).json(openApiDocument);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use('/api/v1/auth', authRouter);

app.use(notFoundHandler);
app.use(errorHandler);
