const redis = require('../config/redis'); // Menghubungkan ke Redis Cloud
const { getPosts, getPostById, createPost, addCommentToPost, addLikeToPost } = require("../models/index");

const postTypeDefs = `#graphql
  type Post {
    _id: ID!
    content: String!
    tags: [String]
    imgUrl: String
    authorId: ID!
    comments: [Comment!]
    likes: [Like!] 
    createdAt: String
    updatedAt: String
    User: User
  }

  type PostAggregate {
    _id: ID!
    content: String!
    tags: [String]
    imgUrl: String
    authorId: ID!
    comments: [Comment!]
    createdAt: String
    updatedAt: String
  }

  type Like {
    username: String!
    createdAt: String!
  }

  type Comment {
    content: String!
    username: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    getPosts: PostListResponse
    getPostById(id: ID!): PostResponse
  }

  input PostInput {
    content: String!
    tags: [String]
    imgUrl: String
  }

  input CommentInput {
    postId: ID!
    comment: String!
  }

  type Mutation {
    addPost(input: PostInput!): PostResponse
    commentPost(input: CommentInput!): PostResponse
    likePost(postId: ID!): PostResponse
  }

  type PostListResponse {
    statusCode: Int!
    data: [Post]
  }

  type PostResponse {
    statusCode: Int!
    data: Post
  }
`;

const postResolvers = {
  Query: {
    getPosts: async () => {
      const cacheKey = 'posts';
      const cachedPosts = await redis.get(cacheKey);

      if (cachedPosts) {
        return {
          statusCode: 200,
          data: JSON.parse(cachedPosts),
        };
      }
      const posts = await getPosts();
      await redis.set(cacheKey, JSON.stringify(posts), 'EX', 3600);

      return {
        statusCode: 200,
        data: posts,
      };
    },

    getPostById: async (_, args) => {
      const { id } = args;
      const cacheKey = `post:${id}`;
      const cachedPost = await redis.get(cacheKey);

      if (cachedPost) {
        return {
          statusCode: 200,
          data: JSON.parse(cachedPost),
        };
      }
      const post = await getPostById(id);
      await redis.set(cacheKey, JSON.stringify(post), 'EX', 3600);

      return {
        statusCode: 200,
        data: post,
      };
    },
  },

  Mutation: {
    addPost: async (_, args, contextValue) => {
      const { content, tags, imgUrl } = args.input;
      const { id: authorId } = await contextValue.doAuthentication();
      const newPost = { content, tags, imgUrl, authorId, createdAt: new Date(), updatedAt: new Date() };
      await createPost(newPost);
      await redis.del('posts');

      return {
        statusCode: 200,
        data: newPost,
      };
    },

    commentPost: async (_, args, contextValue) => {
      const { postId, comment: commentContent } = args.input;
      const { id: userId } = await contextValue.doAuthentication();

      const comment = { content: commentContent, userId };
      const updatedPost = await addCommentToPost(postId, comment);
      await redis.del('posts');
      await redis.del(`post:${postId}`);

      return {
        statusCode: 200,
        data: updatedPost,
      };
    },

    likePost: async (_, args, contextValue) => {
      const { postId } = args;
      const { id: userId } = await contextValue.doAuthentication();
      const updatedPost = await addLikeToPost(postId, userId);
      await redis.del('posts');
      await redis.del(`post:${postId}`);

      return {
        statusCode: 200,
        data: updatedPost,
      };
    },
  },
};

module.exports = {
  postTypeDefs,
  postResolvers,
};
