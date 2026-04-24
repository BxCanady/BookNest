"use client";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import React from "react";
import "./globals.css";

const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://127.0.0.1:8000/graphql",
  }),
  cache: new InMemoryCache(),
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ApolloProvider client={client}>{children}</ApolloProvider>
      </body>
    </html>
  );
}
