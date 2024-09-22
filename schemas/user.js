const { getUserByUsername, createUser } = require("../models/index");
const { generateToken } = require("../utils/jwt");
const { GraphQLError } = require("graphql");
const { hash, compare } = require("../utils/bcrypt"); 

const userTypeDefs = `#graphql
  type User {
    _id: ID!
    name: String!
    username: String!
    password: String!
    email: String!
  }

  type UserWithoutPassword {
    _id: ID!
    name: String!
    username: String!
    email: String!
  }

  type Query {
    searchUsers(username: String!): UserSearchResponse
    login(username: String!, password: String!): UserLoginResponse
  }

  input UserInput {
    name: String!
    username: String!
    email: String!
    password: String!
  }

  type Mutation {
    addUser(input: UserInput!): UserResponse
  }

  type UserResponse {
    statusCode: Int!
    data: User
  }

  type UserSearchResponse {
    statusCode: Int!
    data: [User]
  }

  type UserLoginResponse {
    statusCode: Int!
    data: LoginToken
  }

  type LoginToken {
    token: String!
  }
`;

const userResolvers = {
  Query: {
    login: async (_, args) => {
      const { username, password } = args;
      const user = await getUserByUsername(username);
      if (!user) {
        throw new GraphQLError("Invalid credentials");
      }
      const isValidPassword = compare(password, user.password);
      if (!isValidPassword) {
        throw new GraphQLError("Invalid credentials");
      }
      const payload = {
        id: user._id,
        email: user.email,
      };
      const token = generateToken(payload);

      return {
        statusCode: 200,
        data: { token: token },
      };
    },

    searchUsers: async (_, args) => {
      const { username } = args;
      const user = await getUserByUsername(username);
      if (!user) {
        throw new GraphQLError("User not found");
      }
      const userWithoutPassword = {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      };

      return {
        statusCode: 200,
        data: [userWithoutPassword],
      };
    },
  },

  Mutation: {
    addUser: async (_, args) => {
      const { name, username, email, password } = args.input;
      const hashedPassword = hash(password);
      const newUser = { name, username, email, password: hashedPassword };
      await createUser(newUser);

      return {
        statusCode: 200,
        data: newUser,
      };
    },
  },
};

module.exports = {
  userTypeDefs,
  userResolvers,
};
