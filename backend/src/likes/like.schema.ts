import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BlogPost', sparse: true })
  blogPost?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Comment', sparse: true })
  comment?: Types.ObjectId;

  @Prop({ required: true, enum: ['post', 'comment'], index: true })
  targetType: 'post' | 'comment';

  createdAt?: Date;
  updatedAt?: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Compound unique indexes to prevent duplicate likes
LikeSchema.index({ user: 1, blogPost: 1 }, { unique: true, sparse: true });
LikeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });

// Performance indexes
LikeSchema.index({ blogPost: 1, createdAt: -1 });
LikeSchema.index({ comment: 1, createdAt: -1 });