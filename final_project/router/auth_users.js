const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Returns true if the username is valid (non-empty and not already taken)
const isValid = (username) => {
  if (!username || typeof username !== "string" || username.trim() === "") {
    return false;
  }
  return !users.some((user) => user.username === username);
};

// Returns true if username and password match a record
const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username and password" });
  }

  const accessToken = jwt.sign({ data: password, username }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "User successfully logged in", token: accessToken });
});

// Add or modify a book review (a user can only have one review per book)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review || (req.body && req.body.review);
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  if (!review) {
    return res.status(400).json({ message: "Review text is required (use ?review=...)" });
  }

  const existed = books[isbn].reviews[username] !== undefined;
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: `Review ${existed ? "modified" : "added"} successfully for book ${isbn}`,
    reviews: books[isbn].reviews
  });
});

// Delete a book review (only the logged in user's own review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  if (books[isbn].reviews[username] === undefined) {
    return res.status(404).json({ message: "You have no review for this book" });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `Review for ISBN ${isbn} posted by ${username} deleted`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;