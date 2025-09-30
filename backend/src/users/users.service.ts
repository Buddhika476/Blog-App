import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AppLoggerService } from '../common/logger/logger.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private logger: AppLoggerService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      this.logger.debug(`Creating new user: ${createUserDto.email}`, 'UsersService');
      
      const existingUser = await this.userModel.findOne({
        email: createUserDto.email,
      });
      if (existingUser) {
        this.logger.warn(`User creation failed - email already exists: ${createUserDto.email}`, 'UsersService');
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const createdUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      const savedUser = await createdUser.save();
      
      this.logger.log(
        `User created successfully: ${savedUser._id}`,
        'UsersService',
        {
          userId: savedUser._id,
          email: savedUser.email,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName
        }
      );
      
      return savedUser;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.logError(error, 'UsersService.create', { email: createUserDto.email });
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    try {
      this.logger.debug(`Finding user: ${id}`, 'UsersService');
      
      const user = await this.userModel.findById(id).select('-password').exec();
      if (!user) {
        this.logger.warn(`User not found: ${id}`, 'UsersService');
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(error, 'UsersService.findOne', { userId: id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      this.logger.debug(`Updating user: ${id}`, 'UsersService');
      
      if (updateUserDto.password) {
        this.logger.debug(`Password update for user: ${id}`, 'UsersService');
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .select('-password')
        .exec();

      if (!updatedUser) {
        this.logger.warn(`User not found for update: ${id}`, 'UsersService');
        throw new NotFoundException('User not found');
      }

      this.logger.log(
        `User updated successfully: ${id}`,
        'UsersService',
        {
          userId: id,
          updatedFields: Object.keys(updateUserDto).filter(key => key !== 'password')
        }
      );

      return updatedUser;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(error, 'UsersService.update', { userId: id });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      this.logger.debug(`Deleting user: ${id}`, 'UsersService');
      
      const result = await this.userModel.deleteOne({ _id: id }).exec();
      if (result.deletedCount === 0) {
        this.logger.warn(`User not found for deletion: ${id}`, 'UsersService');
        throw new NotFoundException('User not found');
      }
      
      this.logger.log(`User deleted successfully: ${id}`, 'UsersService', { userId: id });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.logError(error, 'UsersService.remove', { userId: id });
      throw error;
    }
  }
}
