"use client";
import { InMemoryCache, ApolloClient, HttpLink } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import React from "react";
import "./globals.css";

const client = new ApolloClient({
  link: new HttpLink({ uri: "http://127.0.0.1:8000/graphql" }),
  cache: new InMemoryCache(),
});

export default function ApolloWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
