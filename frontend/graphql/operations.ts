import { gql } from "@apollo/client";

export const GET_BOOKS = gql`
  query GetBooks {
    books {
      id
      title
      author
      status
      coverUrl
      bookUrl
    }
  }
`;

export const SEARCH_OPEN_LIBRARY = gql`
  query SearchOpenLibrary($query: String!) {
    searchOpenLibrary(query: $query) {
      key
      title
      authorName
      firstPublishYear
      coverId
    }
  }
`;

export const NYT_OVERVIEW = gql`
  query NytOverview {
    nytOverview {
      listName
      listNameEncoded
      books {
        primaryIsbn13
        title
        author
        bookImage
      }
    }
  }
`;

export const ADD_BOOK = gql`
  mutation AddBook($title: String!, $author: String!) {
    addBook(title: $title, author: $author) {
      id
      title
      author
      status
      coverUrl
      bookUrl
    }
  }
`;

export const UPDATE_BOOK_STATUS = gql`
  mutation UpdateBookStatus($id: ID!, $status: String!) {
    updateBookStatus(id: $id, status: $status) {
      id
      title
      author
      status
    }
  }
`;

export const IMPORT_OPEN_LIBRARY_BOOK = gql`
  mutation ImportOpenLibraryBook(
    $title: String!
    $author: String!
    $coverUrl: String
    $bookUrl: String
  ) {
    importOpenLibraryBook(
      title: $title
      author: $author
      coverUrl: $coverUrl
      bookUrl: $bookUrl
    ) {
      id
      title
      author
      status
      coverUrl
      bookUrl
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password)
  }
`;

export const SIGNUP = gql`
  mutation Signup($email: String!, $password: String!) {
    signup(email: $email, password: $password)
  }
`;
