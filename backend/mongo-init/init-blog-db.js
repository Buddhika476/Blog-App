// MongoDB initialization script for blog application
print('🚀 Initializing Blog App Database...');

// Switch to the blog-app database
db = db.getSiblingDB('blog-app');

// Create a blog application user with read/write permissions
db.createUser({
  user: 'bloguser',
  pwd: 'blogpassword',
  roles: [
    {
      role: 'readWrite',
      db: 'blog-app'
    }
  ]
});

print('✅ Created blog user with readWrite permissions');

// Create collections with validation schemas
print('📝 Creating collections with validation...');

// Users collection with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Password must be at least 6 characters'
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          description: 'First name is required'
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          description: 'Last name is required'
        },
        role: {
          bsonType: 'string',
          enum: ['user', 'admin', 'moderator'],
          description: 'Role must be user, admin, or moderator'
        },
        isActive: {
          bsonType: 'bool',
          description: 'User active status'
        }
      }
    }
  }
});

// Blog posts collection with validation
db.createCollection('blogposts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'content', 'excerpt', 'author'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 200,
          description: 'Title is required and must be 1-200 characters'
        },
        content: {
          bsonType: 'string',
          minLength: 1,
          description: 'Content is required'
        },
        excerpt: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 500,
          description: 'Excerpt is required and must be 1-500 characters'
        },
        author: {
          bsonType: 'objectId',
          description: 'Author must be a valid ObjectId'
        },
        status: {
          bsonType: 'string',
          enum: ['draft', 'published', 'archived'],
          description: 'Status must be draft, published, or archived'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'Tags must be an array of strings'
        },
        views: {
          bsonType: 'int',
          minimum: 0,
          description: 'Views must be a positive integer'
        },
        likesCount: {
          bsonType: 'int',
          minimum: 0,
          description: 'Likes count must be a positive integer'
        },
        commentsCount: {
          bsonType: 'int',
          minimum: 0,
          description: 'Comments count must be a positive integer'
        },
        isDraft: {
          bsonType: 'bool',
          description: 'Draft flag'
        }
      }
    }
  }
});

// Comments collection with validation
db.createCollection('comments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['content', 'author', 'blogPost'],
      properties: {
        content: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 1000,
          description: 'Content is required and must be 1-1000 characters'
        },
        author: {
          bsonType: 'objectId',
          description: 'Author must be a valid ObjectId'
        },
        blogPost: {
          bsonType: 'objectId',
          description: 'Blog post must be a valid ObjectId'
        },
        parentComment: {
          bsonType: ['objectId', 'null'],
          description: 'Parent comment must be a valid ObjectId or null'
        },
        likesCount: {
          bsonType: 'int',
          minimum: 0,
          description: 'Likes count must be a positive integer'
        },
        isDeleted: {
          bsonType: 'bool',
          description: 'Deletion flag'
        }
      }
    }
  }
});

// Likes collection with validation
db.createCollection('likes', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'targetType'],
      properties: {
        user: {
          bsonType: 'objectId',
          description: 'User must be a valid ObjectId'
        },
        blogPost: {
          bsonType: ['objectId', 'null'],
          description: 'Blog post must be a valid ObjectId or null'
        },
        comment: {
          bsonType: ['objectId', 'null'],
          description: 'Comment must be a valid ObjectId or null'
        },
        targetType: {
          bsonType: 'string',
          enum: ['post', 'comment'],
          description: 'Target type must be post or comment'
        }
      }
    }
  }
});

print('✅ Collections created with validation schemas');

// Create indexes for better performance
print('🚀 Creating indexes...');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Blog posts indexes
db.blogposts.createIndex({ author: 1 });
db.blogposts.createIndex({ status: 1 });
db.blogposts.createIndex({ createdAt: -1 });
db.blogposts.createIndex({ publishedAt: -1 });
db.blogposts.createIndex({ tags: 1 });
db.blogposts.createIndex({ title: 'text', content: 'text', excerpt: 'text' });
db.blogposts.createIndex({ isDraft: 1, author: 1 });
db.blogposts.createIndex({ lastSavedAt: -1 });

// Comments indexes
db.comments.createIndex({ blogPost: 1 });
db.comments.createIndex({ author: 1 });
db.comments.createIndex({ parentComment: 1 });
db.comments.createIndex({ createdAt: -1 });
db.comments.createIndex({ blogPost: 1, parentComment: 1, isDeleted: 1 });

// Likes indexes (with unique constraints)
db.likes.createIndex({ user: 1, blogPost: 1 }, { unique: true, sparse: true });
db.likes.createIndex({ user: 1, comment: 1 }, { unique: true, sparse: true });
db.likes.createIndex({ blogPost: 1 });
db.likes.createIndex({ comment: 1 });
db.likes.createIndex({ user: 1 });

print('✅ Indexes created successfully');

// Insert sample data for testing
print('📊 Inserting sample data...');

// Insert sample users
const sampleUsers = [
  {
    email: 'john.doe@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    firstName: 'John',
    lastName: 'Doe',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: 'jane.smith@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: 'bob.johnson@example.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
    firstName: 'Bob',
    lastName: 'Johnson',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const insertedUsers = db.users.insertMany(sampleUsers);
const userIds = Object.values(insertedUsers.insertedIds);

print(`✅ Inserted ${userIds.length} sample users`);

// Insert sample blog posts
const samplePosts = [
  {
    title: 'Getting Started with NestJS and MongoDB',
    content: 'NestJS is a powerful Node.js framework that works great with MongoDB. In this post, we\'ll explore how to build a scalable blog application using these technologies. We\'ll cover authentication, CRUD operations, and advanced features like comments and likes.',
    excerpt: 'Learn how to build a blog application with NestJS and MongoDB',
    author: userIds[0],
    tags: ['nestjs', 'mongodb', 'nodejs', 'typescript'],
    status: 'published',
    isDraft: false,
    views: 150,
    likesCount: 12,
    commentsCount: 5,
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    lastSavedAt: new Date(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    title: 'Advanced TypeScript Patterns',
    content: 'TypeScript offers many advanced patterns that can help you write more maintainable and type-safe code. In this comprehensive guide, we\'ll explore decorators, generics, utility types, and more advanced concepts that will elevate your TypeScript skills.',
    excerpt: 'Explore advanced TypeScript patterns and best practices',
    author: userIds[1],
    tags: ['typescript', 'javascript', 'patterns', 'development'],
    status: 'published',
    isDraft: false,
    views: 89,
    likesCount: 7,
    commentsCount: 3,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    lastSavedAt: new Date(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    title: 'Building RESTful APIs with Authentication',
    content: 'This is a draft post about building secure RESTful APIs with proper authentication and authorization. We\'ll cover JWT tokens, password hashing, and security best practices.',
    excerpt: 'Learn to build secure APIs with authentication',
    author: userIds[0],
    tags: ['api', 'authentication', 'security', 'jwt'],
    status: 'draft',
    isDraft: true,
    views: 0,
    likesCount: 0,
    commentsCount: 0,
    lastSavedAt: new Date(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date()
  }
];

const insertedPosts = db.blogposts.insertMany(samplePosts);
const postIds = Object.values(insertedPosts.insertedIds);

print(`✅ Inserted ${postIds.length} sample blog posts`);

// Insert sample comments
const sampleComments = [
  {
    content: 'Great post! This really helped me understand NestJS better.',
    author: userIds[1],
    blogPost: postIds[0],
    parentComment: null,
    replies: [],
    likesCount: 3,
    isDeleted: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    content: 'I agree! The MongoDB integration examples were particularly useful.',
    author: userIds[2],
    blogPost: postIds[0],
    parentComment: null,
    replies: [],
    likesCount: 1,
    isDeleted: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    content: 'Thanks for the feedback! I\'m glad it was helpful.',
    author: userIds[0],
    blogPost: postIds[0],
    parentComment: null,
    replies: [],
    likesCount: 2,
    isDeleted: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

const insertedComments = db.comments.insertMany(sampleComments);
const commentIds = Object.values(insertedComments.insertedIds);

print(`✅ Inserted ${commentIds.length} sample comments`);

// Insert sample likes
const sampleLikes = [
  {
    user: userIds[1],
    blogPost: postIds[0],
    targetType: 'post',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    user: userIds[2],
    blogPost: postIds[0],
    targetType: 'post',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    user: userIds[0],
    blogPost: postIds[1],
    targetType: 'post',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    user: userIds[2],
    comment: commentIds[0],
    targetType: 'comment',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

const insertedLikes = db.likes.insertMany(sampleLikes);

print(`✅ Inserted ${Object.keys(insertedLikes.insertedIds).length} sample likes`);

print('🎉 Blog App Database initialization completed successfully!');
print('📊 Database Summary:');
print(`   👥 Users: ${db.users.countDocuments()}`);
print(`   📝 Blog Posts: ${db.blogposts.countDocuments()}`);
print(`   💬 Comments: ${db.comments.countDocuments()}`);
print(`   ❤️  Likes: ${db.likes.countDocuments()}`);
print('🔑 Database Credentials:');
print('   Username: bloguser');
print('   Password: blogpassword');
print('   Database: blog-app');