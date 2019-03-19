const { ApolloServer, gql } = require("apollo-server");
const fetch = require("node-fetch");

const typeDefs = gql`
  type QuoteResponse {
    id: String!
    quote: String!
  }

  type KanyeResponse {
    id: String!
    quote: String!
  }

  type ChuckResponse {
    id: String!
    value: String!
    url: String!
    icon_url: String!
  }

  union QuoteUnionResponse = KanyeResponse | ChuckResponse

  type Advice {
    kanye: QuoteResponse!
    chuckNorris: QuoteResponse!
  }

  type Query {
    advice: Advice!
    kanyeOrChuckQuote: QuoteUnionResponse!
    searchRecipes(query: String!): [Recipe!]!
  }
`;

const cache = {};
const dateStore = {};

const resolvers = {
  Advice: {
    kanye: async () => {
      const response = await fetch("https://api.kanye.rest/");
      const data = await response.json();
      return data;
    },
    chuckNorris: async () => {
      const response = await fetch("https://api.chucknorris.io/jokes/random");
      const data = await response.json();
      return {
        id: data.id,
        quote: data.value
      };
    }
  },
  Query: {
    advice: () => ({}),
    searchRecipes: async (_, { query }) => {
      // check if in cache
      if (cache[query]) {
        // cache hit
        // returning data from the cache
        return cache[query];
      }

      const p1 = fetch(`https://api.kanye.rest/?keyword=${query}`);
      const p2 = fetch("https://api.chucknorris.io/jokes/random");

      const [p1Data, p2Data] = await Promise.all([p1, p2]);

      const normalizedP1Data = p1Data.recipes.map(x => ({
        name: x.recipeName,
        servings: x.yield
      }));

      const normalizedP2Data = p2Data.recipes.map(x => ({
        name: x.name,
        servings: x.servings
      }));

      const totallyNormalized = [...normalizedP1Data, ...normalizedP2Data];

      // fill the cache
      // expire after x seconds
      cache[query] = totallyNormalized;
      dateStore[query] = new Date();

      return totallyNormalized;
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
