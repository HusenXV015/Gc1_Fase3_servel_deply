const { followUser, getFollowers, getFollowing } = require("../models/index");

const followTypeDefs = `#graphql
  type Follow {
    _id: ID!
    followerId: ID!
    followingId: ID!
    createdAt: String
  }

  type Query {
    getFollowers(userId: ID!): FollowListResponse
    getFollowing(userId: ID!): FollowListResponse
  }

  input FollowInput {
    followingId: ID!
  }

  type Mutation {
    followUser(input: FollowInput!): FollowResponse
  }

  type FollowListResponse {
    statusCode: Int!
    data: [User]
  }

  type FollowResponse {
    statusCode: Int!
    data: Follow
  }
`;

const followResolvers = {
  Query: {
    getFollowers: async (_, args) => {
      const { userId } = args;
      const followers = await getFollowers(userId);
      return {
        statusCode: 200,
        data: followers,
      };
    },
    getFollowing: async (_, args) => {
      const { userId } = args;
      const following = await getFollowing(userId);
      return {
        statusCode: 200,
        data: following,
      };
    },
  },
  Mutation: {
    followUser: async (_, args, contextValue) => {
      const { id: followerId } = await contextValue.doAuthentication();
      const { followingId } = args.input;
      const newFollow = await followUser(followerId, followingId);
      return {
        statusCode: 200,
        data: newFollow,
      };
    },
  },
};

module.exports = {
  followTypeDefs,
  followResolvers,
};