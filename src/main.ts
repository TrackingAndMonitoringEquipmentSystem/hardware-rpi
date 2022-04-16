import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
const logger = new Logger('main');
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(Number(process.env.APP_PORT) | 3000);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
