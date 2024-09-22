const { getDb } = require("../config/mongo-connection");
const { ObjectId } = require("mongodb");

const USERS_COLLECTION = "Users";
const POSTS_COLLECTION = "Posts";
const FOLLOWS_COLLECTION = "Follows";

// User Models
const getUserByEmail = async (email) => {
  const db = await getDb();
  const result = await db.collection(USERS_COLLECTION).findOne({ email }, { projection: { password: 0 } });
  return result;
};

const getUserByUsername = async (username) => {
  const db = await getDb();
  const result = await db.collection(USERS_COLLECTION).findOne({ username });
  return result;
};

const createUser = async (user) => {
  const db = await getDb();
  const result = await db.collection(USERS_COLLECTION).insertOne(user);
  return result;
};

// Post Models
const getPosts = async () => {
  const db = await getDb();
  const posts = await db
  .collection(POSTS_COLLECTION)
  .aggregate([
    {
      $lookup: {
          from: USERS_COLLECTION, 
          localField: 'authorId', 
          foreignField: '_id', 
          as: 'User'
      }
    },
    {
      $unwind: {
        path: '$User', 
        preserveNullAndEmptyArrays: true
      }
    }

  ])
  .toArray();
  return posts;
};

const getPostById = async (id) => {
  const db = await getDb();
  const post = await db.collection(POSTS_COLLECTION).findOne({ _id: new ObjectId(id) });
  return post;
};

const createPost = async (post) => {
  const db = await getDb();
  const result = await db.collection(POSTS_COLLECTION).insertOne(post);
  return result;
};

const addCommentToPost = async (postId, comment) => {
  const db = await getDb();
  
  const user = await db.collection(USERS_COLLECTION).findOne({ _id: new ObjectId(comment.userId) });
  
  if (!user) {
    throw new Error("User not found");
  }

  const newComment = {
    content: comment.content,
    username: user.username,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection(POSTS_COLLECTION).updateOne(
    { _id: new ObjectId(postId) },
    { $push: { comments: newComment }, $set: { updatedAt: new Date() } }
  );
  
  const updatedPost = await getPostById(postId);
  return updatedPost;
};

const addLikeToPost = async (postId, userId) => {
  const db = await getDb();
  const user = await db.collection(USERS_COLLECTION).findOne({ _id: new ObjectId(userId) });
  
  if (!user) {
    throw new Error("User not found");
  }
  const newLike = {
    username: user.username,
    createdAt: new Date(),
  };
  await db.collection(POSTS_COLLECTION).updateOne(
    { 
      _id: new ObjectId(postId),
      "likes.username": { $ne: user.username } 
    },
    { $push: { likes: newLike }, $set: { updatedAt: new Date() } }
  );

  const updatedPost = await getPostById(postId);
  return updatedPost;
};

// Follow Models
const followUser = async (followerId, followingId) => {
  const db = await getDb();
  const newFollow = {
    followerId: new ObjectId(followerId),
    followingId: new ObjectId(followingId),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection(FOLLOWS_COLLECTION).insertOne(newFollow);
  return newFollow;
};

const getFollowers = async (userId) => {
  const db = await getDb();
  const followers = await db.collection(FOLLOWS_COLLECTION).find({ followingId: new ObjectId(userId) }).toArray();
  return followers;
};

const getFollowing = async (userId) => {
  const db = await getDb();
  const following = await db.collection(FOLLOWS_COLLECTION).find({ followerId: new ObjectId(userId) }).toArray();
  return following;
};

module.exports = {
  getUserByEmail,
  getUserByUsername,
  createUser,
  getPosts,
  getPostById,
  createPost,
  addCommentToPost,
  followUser,
  getFollowers,
  getFollowing,
  addLikeToPost
};
