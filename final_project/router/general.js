const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        if (!isValid(username)) {
            users.push({"username":username,"password":password});
            return res.status(200).json({message: "Customer successfully registered. Now you can login"});
        } else {
            return res.status(404).json({message: "User already exists!"});
        }
    }
    return res.status(404).json({message: "Unable to register user."});
});

// Get the book list available in the shop using Promise/Async
public_users.get('/', async function (req, res) {
    try {
        const getBooks = () => new Promise((resolve) => resolve(books));
        const bookList = await getBooks();
        return res.status(200).send(JSON.stringify(bookList, null, 4));
    } catch (error) {
        return res.status(500).json({ message: "Error retrieving books" });
    }
});

// Get book details based on ISBN using Promises
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const getBookByISBN = new Promise((resolve, reject) => {
        if (books[isbn]) {
            resolve(books[isbn]);
        } else {
            reject({ status: 404, message: "ISBN not found" });
        }
    });

    getBookByISBN
        .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
        .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});
  
// Get book details based on author using Promises
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author;
    const getBooksByAuthor = new Promise((resolve, reject) => {
        let matchingBooks = [];
        let isbns = Object.keys(books);
        isbns.forEach((isbn) => {
            if (books[isbn]["author"] === author) {
                matchingBooks.push({
                    isbn: isbn,
                    title: books[isbn]["title"],
                    reviews: books[isbn]["reviews"]
                });
            }
        });
        if (matchingBooks.length > 0) {
            resolve({ booksbyauthor: matchingBooks });
        } else {
            reject({ status: 404, message: "No books found for this author" });
        }
    });

    getBooksByAuthor
        .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
        .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});

// Get all books based on title using Promises
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;
    const getBooksByTitle = new Promise((resolve, reject) => {
        let matchingBooks = [];
        let isbns = Object.keys(books);
        isbns.forEach((isbn) => {
            if (books[isbn]["title"] === title) {
                matchingBooks.push({
                    isbn: isbn,
                    author: books[isbn]["author"],
                    reviews: books[isbn]["reviews"]
                });
            }
        });
        if (matchingBooks.length > 0) {
            resolve({ booksbytitle: matchingBooks });
        } else {
            reject({ status: 404, message: "No books found with this title" });
        }
    });

    getBooksByTitle
        .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
        .catch((err) => res.status(err.status || 500).json({ message: err.message }));
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
    } else {
        return res.status(404).json({message: "ISBN not found"});
    }
});

module.exports.general = public_users;
