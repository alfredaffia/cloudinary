import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as dotenv from 'dotenv'
import { JwtStrategy } from '../Auth/jwt.strategy';
import { CloudinaryModule } from 'src/cloudinary/coudinary.module';
import { uploadSchema } from './schemas/file.schema';

dotenv.config()

@Module({
    
  imports: [
    CloudinaryModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema },{ name: 'Upload', schema: uploadSchema }],),

      JwtModule.register({
    global:true,
    secret:process.env.JWTSECRET,
    signOptions:{expiresIn:'1h'}

  }),
  PassportModule.register({
    defaultStrategy:'jwt',
    session:true
  }),
  
  ],
  controllers: [UserController],
providers: [UserService,JwtStrategy
],

  exports: [UserService, JwtModule, PassportModule, MongooseModule],
})
export class UserModule { }
