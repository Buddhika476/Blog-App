import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlogPostDocument = BlogPost & Document;

@Schema({ timestamps: true })
export class BlogPost {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  excerpt: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 'draft', enum: ['draft', 'published', 'archived'] })
  status: string;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop()
  publishedAt: Date;

  @Prop({ default: Date.now })
  lastSavedAt: Date;

  @Prop({ default: false })
  isDraft: boolean;

  @Prop()
  scheduledPublishAt: Date;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop()
  featuredImage: string;
}

export const BlogPostSchema = SchemaFactory.createForClass(BlogPost);
