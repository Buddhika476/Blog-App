import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AppLoggerService } from '../common/logger/logger.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logger: AppLoggerService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      this.logger.debug(`Validating user login for email: ${email}`, 'AuthService');
      
      const user = await this.usersService.findByEmail(email);
      if (user && (await bcrypt.compare(pass, user.password))) {
        const userObject = user.toObject();
        delete userObject.password;
        
        this.logger.logAuthentication('Login successful', user._id.toString(), { email });
        return userObject;
      }
      
      this.logger.logSecurity('Failed login attempt', { email, reason: 'Invalid credentials' });
      return null;
    } catch (error) {
      this.logger.logError(error, 'AuthService.validateUser', { email });
      throw error;
    }
  }

  async login(user: any) {
    try {
      const payload = { email: user.email, sub: user._id };
      const token = this.jwtService.sign(payload);
      
      this.logger.logAuthentication('JWT token generated', user._id, { email: user.email });
      
      return {
        access_token: token,
        user: {
          _id: user._id,
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      this.logger.logError(error, 'AuthService.login', { userId: user._id });
      throw error;
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      this.logger.debug(`Registering new user: ${registerDto.email}`, 'AuthService');
      
      const user = await this.usersService.create(registerDto);
      const userDoc = user as any;

      const payload = { email: user.email, sub: userDoc._id };
      const token = this.jwtService.sign(payload);
      
      this.logger.logAuthentication('User registered successfully', userDoc._id, { 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName 
      });
      
      return {
        access_token: token,
        user: {
          _id: userDoc._id,
          id: userDoc._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      this.logger.logError(error, 'AuthService.register', { email: registerDto.email });
      throw error;
    }
  }
}
