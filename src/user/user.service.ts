import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException, Res, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';
import { Upload } from './schemas/file.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
    @InjectModel(Upload.name)
    private uploadModel: Model<Upload>,
  ) { }

  async create(payload: CreateUserDto) {

    try {
      const existingUser = await this.userModel.findOne({ email: payload.email });
      if (existingUser) {
        throw new ConflictException('email already exists, login or input new email address');
      }

      payload.email = payload.email.toLowerCase()
      const { email, password, ...rest } = payload;
      const user = await this.userModel.findOne({ where: { email: email } });
      if (user) {
        throw new HttpException('user with this email already exist', 400)
      }
      const hashPassword = await argon2.hash(password);

      const userDetails = await this.userModel.create({
        email,
        password: hashPassword,

        ...rest
      })

      const Userpayload = { id: userDetails.id, email: userDetails.email };
      return {
        userId: userDetails.id,
        userEmail: userDetails.email,
        access_token: await this.jwtService.signAsync(Userpayload),
      };
    }
    catch (error) {
      throw error;
    }



  }

  async findEmail(email: string) {
    const mail = await this.userModel.findOne({ email })
    if (!mail) {
      throw new UnauthorizedException()
    }
    return mail;
  }

  async signIn(payload: LoginDto,
  ) {
    const { email, password } = payload;
    const users = await this.userModel.findOne({ where: { email: email } })
    const user = await this.userModel.findOne({ email: payload.email }).select('+password');

    if (!user) {
      throw new HttpException('No email found', 400)
    }
    const checkedPassword = await this.verifyPassword(user.password, password);
    if (!checkedPassword) {
      throw new HttpException('password incorrect', 400)
    }
    const token = await this.jwtService.signAsync({
      email: user.email,
      id: user.id
    });

    // delete user.password
    return {
      success: true,
      userToken: token

    }
  }

  async verifyPassword(hashedPassword: string, plainPassword: string,): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (err) {
      console.log(err.message)
      return false;
    }
  }


  async user(headers: any): Promise<any> {
    const authorizationHeader = headers.authorization; //It tries to extract the authorization header from the incoming request headers. This header typically contains the token used for authentication.
    if (authorizationHeader) {
      const token = authorizationHeader.replace('Bearer ', '');
      const secret = process.env.JWTSECRET;
      //checks if the authorization header exists. If not, it will skip to the else block and throw an error.
      try {
        const decoded = this.jwtService.verify(token);
        let id = decoded["id"]; // After verifying the token, the function extracts the user's id from the decoded token payload.
        let user = await this.userModel.findOne({ id });
        return { id: id, email: user?.email, };
      } catch (error) {
        throw new UnauthorizedException('Invalid token');

      }
    } else
      throw new UnauthorizedException('Invalid or missing Bearer token');

  }

  findAll() {
    const findAll = this.userModel.find();
  }

  async findOne(id: string) {
    const user = await this.userModel.find()

    const findUserById = await this.userModel.findOne({ id });
    if (!findUserById) {
      throw new HttpException('User not found', 404);
    }

    return findUserById;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const newUpdate = await this.userModel.findOne({ where: { id } })
    if (!newUpdate) {
      throw new NotFoundException('user not found')
    }

    const updateUser = await this.userModel.updateOne({ id }, updateUserDto)
    const updatedUser = await this.userModel.findOne({ where: { id } })
    return {
      statusCode: 200,
      message: 'user updated successfully',
      data: updatedUser
    }
  }


  async uploadFile(file: Express.Multer.File, id: string)// : Promise<UploadApiResponse> 
  {
    if (!file) {
      throw new BadRequestException('No file provided.');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPG, PNG, and PDF are allowed.');
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    return new Promise(async (resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        async (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(new BadRequestException('File upload failed.'));
          }

          if (!result) {
            return reject(new BadRequestException('Cloudinary did not return a result.'));
          }

          try {
            const uploadedFile = new this.uploadModel({
              filename: file.originalname,
              url: result.secure_url,
              format: result.format,
              size: file.size,
              uploadedAt: new Date(),
            });
            const user = await this.userModel.findById(id)
            if (!user) {
              throw new NotFoundException('User not found');
            }
       

            await uploadedFile.save(); // Save to MongoDB
            resolve({
                          message: 'File uploaded successfully',
            profilePictureUrl: result.secure_url,
            uploadDetails: uploadedFile}
            ); // Return the Cloudinary response

          } catch (dbError) {
            console.error('Database Save Error:', dbError);
            reject(new BadRequestException('Database save failed.'));
          }
        },
      );

      const fileStream = Readable.from(file.buffer);
      fileStream.pipe(uploadStream);





    });
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
