import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StreamAndRecordVideoModule } from './stream-and-record-video/stream-and-record-video.module';
import { EntitiesMap } from './entities/entities';
import { FaceRecognitionModule } from './face-recognition/face-recognition.module';
import { LockerModule } from './locker/locker.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    LockerModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      synchronize: JSON.parse(process.env.DB_SYNC),
      entities: [...EntitiesMap],
      logging: true,
    }),
    FaceRecognitionModule,
    StreamAndRecordVideoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
