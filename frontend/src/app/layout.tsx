"use client";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { setContext } from "@apollo/client/link/context";
import React from "react";
import "./globals.css";

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://127.0.0.1:8000/graphql",
});

const authLink = setContext((_, { headers }) => {
  if (typeof window === "undefined") {
    return { headers };
  }

  const userId = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("userId="))
    ?.split("=")[1];

  return {
    headers: {
      ...headers,
      ...(userId ? { "x-user-id": userId } : {}),
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
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
