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