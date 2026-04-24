import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export const apolloClient = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://127.0.0.1:8000/graphql",
  }),
  cache: new InMemoryCache(),
});
