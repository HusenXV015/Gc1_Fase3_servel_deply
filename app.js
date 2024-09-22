if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
  }

const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { GraphQLError } = require("graphql");

const { userResolvers,userTypeDefs } = require("./schemas/user")
const { getClientInstance } = require("./config/mongo-connection");
const authN = require("./utils/auth");
const { postTypeDefs, postResolvers } = require("./schemas/post");
const { followTypeDefs, followResolvers } = require("./schemas/follow");

const server = new ApolloServer({
    typeDefs: [userTypeDefs,postTypeDefs,followTypeDefs],
    resolvers: [userResolvers,postResolvers,followResolvers],
    introspection: true,
});

(async () => {
    // Connect to database
    await getClientInstance();
    console.log("Database connected successfully");
  
    const { url } = await startStandaloneServer(server, {
      listen: 4000,
      context: async ({ req, res }) => {
        console.log("this console will be triggered on every request");
  
        return {
          dummyFunction: () => {
            console.log("We can read headers here", req.headers);
          },
          doAuthentication: async () => await authN(req),
        };
      },
    });
  
    console.log(`🚀 Server ready at ${url}`);
  })();