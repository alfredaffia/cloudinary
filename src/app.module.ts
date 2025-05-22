import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';

@Module({
  imports: [
        ConfigModule.forRoot({
      isGlobal: true
    }), 
    MongooseModule.forRootAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory: async (configService: ConfigService) => ({
   uri: configService.get<string>('DB_URI'),
   
      })
      }), UserModule,
  ],
})
export class AppModule {}
