import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { BlogPostsModule } from './blog-posts/blog-posts.module';
import { CommentsModule } from './comments/comments.module';
import { LikesModule } from './likes/likes.module';
import { UploadsModule } from './uploads/uploads.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    MongooseModule.forRoot(
      process.env.DATABASE_URL || 'mongodb://localhost:27017/blog-app',
    ),
    UsersModule,
    AuthModule,
    BlogPostsModule,
    CommentsModule,
    LikesModule,
    UploadsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
