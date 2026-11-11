const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

/* ---------- Promise-based data helpers (non-blocking) ---------- */

const fetchAllBooks = () => new Promise((resolve) => resolve(books));

const fetchByISBN = (isbn) =>
  new Promise((resolve, reject) => {
    if (books[isbn]) resolve(books[isbn]);
    else reject(new Error(`Book with ISBN ${isbn} not found`));
  });

const fetchByField = (field, value) =>
  new Promise((resolve, reject) => {
    const term = value.toLowerCase();
    const result = {};
    Object.keys(books).forEach((isbn) => {
      if (books[isbn][field].toLowerCase().includes(term)) {
        result[isbn] = books[isbn];
      }
    });
    if (Object.keys(result).length > 0) resolve(result);
    else reject(new Error(`No books found for ${field} "${value}"`));
  });

/* ---------- Routes ---------- */

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists or username is invalid" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await fetchAllBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const book = await fetchByISBN(req.params.isbn);
    return res.status(200).send(JSON.stringify(book, null, 4));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Get book details based on author
public_users.get('/author/:author', async (req, res) => {
  try {
    const result = await fetchByField("author", req.params.author);
    return res.status(200).send(JSON.stringify(result, null, 4));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Get all books based on title
public_users.get('/title/:title', async (req, res) => {
  try {
    const result = await fetchByField("title", req.params.title);
    return res.status(200).send(JSON.stringify(result, null, 4));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Get book review
public_users.get('/review/:isbn', async (req, res) => {
  try {
    const book = await fetchByISBN(req.params.isbn);
    return res.status(200).send(JSON.stringify(book.reviews, null, 4));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

/* ---------- Task 10: Axios client methods (async/await) ----------
   These call the running server over HTTP. Start the server first
   (node index.js), then run:  node router/general.js            */

const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

const getBookByISBN = async (isbn) => {
  const response = await axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`);
  return response.data;
};

const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

const getBooksByTitle = async (title) => {
  const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
  return response.data;
};

// Demo runner: only executes when this file is run directly
if (require.main === module) {
  (async () => {
    try {
      console.log("All books:", await getAllBooks());
      console.log("By ISBN 1:", await getBookByISBN(1));
      console.log("By author:", await getBooksByAuthor("Jane Austen"));
      console.log("By title:", await getBooksByTitle("Pride and Prejudice"));
    } catch (err) {
      console.error("Request failed:", err.response ? err.response.data : err.message);
    }
  })();
}

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;