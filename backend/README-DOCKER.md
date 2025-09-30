# Blog App - MongoDB with Docker

This guide will help you set up MongoDB using Docker for the Blog Application.

## 🐳 What's Included

- **MongoDB 7.0**: Main database server
- **Mongo Express**: Web-based MongoDB admin interface
- **Initialization Script**: Automatic database setup with sample data
- **Persistent Storage**: Data persists between container restarts

## 🚀 Quick Start

### 1. Start MongoDB with Docker Compose

```bash
# Start MongoDB and Mongo Express
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f mongodb
```

### 2. Access Your Database

**MongoDB Connection:**
- **Host**: `localhost`
- **Port**: `27017`
- **Database**: `blog-app`
- **Username**: `bloguser`
- **Password**: `blogpassword`
- **Connection String**: `mongodb://bloguser:blogpassword@localhost:27017/blog-app`

**Mongo Express (Web UI):**
- **URL**: http://localhost:8081
- **No authentication required** (disabled for development)

### 3. Update Your Application

Copy the Docker environment variables:
```bash
cp .env.docker .env
```

Or update your existing `.env` file with:
```
DATABASE_URL=mongodb://bloguser:blogpassword@localhost:27017/blog-app
```

### 4. Start Your NestJS Application

```bash
# Install dependencies (if not done already)
yarn install

# Start the application
yarn dev
```

## 📊 Sample Data

The database is automatically initialized with:

### 👥 Users (3 sample users)
- **john.doe@example.com** (Admin)
- **jane.smith@example.com** (User)
- **bob.johnson@example.com** (User)
- **Password for all**: `password`

### 📝 Blog Posts (3 sample posts)
- 2 Published posts with views, likes, and comments
- 1 Draft post for testing draft functionality

### 💬 Comments (3 sample comments)
- Comments on the first blog post
- Includes author information and timestamps

### ❤️ Likes (4 sample likes)
- Likes on posts and comments
- Demonstrates the like system

## 🛠️ Docker Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View MongoDB logs only
docker-compose logs -f mongodb
```

### Database Management
```bash
# Connect to MongoDB shell
docker exec -it blog-app-mongodb mongosh -u admin -p password123

# Backup database
docker exec blog-app-mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/blog-app" --out=/backup

# Restore database
docker exec blog-app-mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017/blog-app" /backup/blog-app
```

### Data Management
```bash
# Remove all data (WARNING: This deletes everything!)
docker-compose down -v

# Remove containers and images
docker-compose down --rmi all

# Reset everything (containers, volumes, images)
docker-compose down -v --rmi all
```

## 🔧 Configuration

### Environment Variables

**Docker Compose Variables:**
- `MONGO_INITDB_ROOT_USERNAME`: MongoDB admin username
- `MONGO_INITDB_ROOT_PASSWORD`: MongoDB admin password
- `MONGO_INITDB_DATABASE`: Initial database name

**Application Variables:**
- `DATABASE_URL`: Full MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time

### Ports
- **27017**: MongoDB server
- **8081**: Mongo Express web interface
- **3001**: Your NestJS application

## 📁 File Structure

```
backend/
├── docker-compose.yml          # Docker services configuration
├── .env.docker                 # Docker environment variables
├── mongo-init/
│   └── init-blog-db.js         # Database initialization script
└── README-DOCKER.md           # This file
```

## 🔍 Database Schema

### Collections Created:
- **users**: User accounts with validation
- **blogposts**: Blog posts with draft support
- **comments**: Comments with nested replies
- **likes**: Like system for posts and comments

### Indexes Created:
- Email uniqueness for users
- Performance indexes for queries
- Text search indexes for blog posts
- Unique constraints for likes

## 🐛 Troubleshooting

### Container Won't Start
```bash
# Check Docker is running
docker --version

# Check ports aren't in use
lsof -i :27017
lsof -i :8081

# Check container logs
docker-compose logs mongodb
```

### Connection Issues
```bash
# Test MongoDB connection
docker exec -it blog-app-mongodb mongosh -u bloguser -p blogpassword blog-app

# Check if initialization completed
docker-compose logs mongodb | grep "initialization completed"
```

### Reset Database
```bash
# Stop and remove everything
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Permission Issues
```bash
# Fix MongoDB data directory permissions (Linux/Mac)
sudo chown -R 999:999 ./mongodb_data
```

## 🔐 Security Notes

**Development Setup:**
- Uses simple passwords for development
- Mongo Express has no authentication
- Admin user has full access

**Production Recommendations:**
- Change all default passwords
- Enable authentication for Mongo Express
- Use environment-specific credentials
- Enable SSL/TLS connections
- Restrict network access

## 📈 Monitoring

### Check Database Status
```bash
# Database statistics
docker exec blog-app-mongodb mongosh -u admin -p password123 --eval "db.stats()"

# Collection counts
docker exec blog-app-mongodb mongosh -u bloguser -p blogpassword blog-app --eval "
  print('Users:', db.users.countDocuments());
  print('Posts:', db.blogposts.countDocuments());
  print('Comments:', db.comments.countDocuments());
  print('Likes:', db.likes.countDocuments());
"
```

### Performance Monitoring
```bash
# MongoDB performance stats
docker exec blog-app-mongodb mongosh -u admin -p password123 --eval "db.serverStatus()"

# Current operations
docker exec blog-app-mongodb mongosh -u admin -p password123 --eval "db.currentOp()"
```

## 🎯 Next Steps

1. **Start the containers**: `docker-compose up -d`
2. **Verify the setup**: Visit http://localhost:8081
3. **Update your app**: Use the connection string in your `.env`
4. **Test the API**: Use the provided Postman collection
5. **Develop your app**: Start coding with a fully functional database!

Your MongoDB database is now ready for development! 🎉