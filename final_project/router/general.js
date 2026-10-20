const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

/**
 * Helper function to uniformly handle error responses across all endpoints.
 * @param {Object} res - Express response object
 * @param {Object} error - Error object with optional status and message
 */
const handleError = (res, error) => {
    const status = error.status || 404;
    const message = error.message || "An unexpected error occurred";
    return res.status(status).json({ message });
};

/**
 * Reusable helper function to filter books by a dynamic key (author, title, or isbn)
 * to eliminate code duplication across multiple endpoints.
 * @param {string} field - The property to filter by ('author', 'title', or 'isbn')
 * @param {string} value - The value to match against
 * @returns {Promise<Array|Object>} - Promise resolving to matching book data
 */
const filterBooks = (field, value) => {
    return new Promise((resolve, reject) => {
        if (field === 'isbn') {
            if (books[value]) {
                resolve(books[value]);
            } else {
                reject({ status: 404, message: `Book with ISBN ${value} not found` });
            }
            return;
        }

        const results = Object.keys(books)
            .filter((isbn) => books[isbn][field] === value)
            .map((isbn) => ({
                isbn,
                author: books[isbn].author,
                title: books[isbn].title,
                reviews: books[isbn].reviews
            }));

        if (results.length > 0) {
            resolve(results);
        } else {
            reject({ status: 404, message: `No books found matching ${field}: ${value}` });
        }
    });
};

/**
 * Register a new customer account.
 */
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return handleError(res, { status: 400, message: "Username and password are required" });
    }

    if (isValid(username)) {
        return handleError(res, { status: 409, message: "User already exists!" });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

/**
 * Internal data endpoint used by Axios calls to fetch raw books database.
 */
public_users.get('/books-data', (req, res) => {
    return res.status(200).json(books);
});

/**
 * Task 10: Get the list of all books available in the shop using async/await with Axios.
 */
public_users.get('/', async function (req, res) {
    try {
        const response = await axios.get(`${BASE_URL}/books-data`);
        return res.status(200).send(JSON.stringify(response.data, null, 4));
    } catch (error) {
        return handleError(res, { status: 500, message: "Failed to retrieve books list" });
    }
});

/**
 * Task 11: Get book details based on ISBN using Promise callbacks and Axios.
 */
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    axios.get(`${BASE_URL}/books-data`)
        .then((response) => {
            const allBooks = response.data;
            if (allBooks[isbn]) {
                return res.status(200).send(JSON.stringify(allBooks[isbn], null, 4));
            }
            return handleError(res, { status: 404, message: "ISBN not found" });
        })
        .catch(() => filterBooks('isbn', isbn)
            .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
            .catch((err) => handleError(res, err))
        );
});

/**
 * Task 12: Get book details based on Author using async/await with Axios and reusable filtering.
 */
public_users.get('/author/:author', async function (req, res) {
    const author = req.params.author;
    try {
        const response = await axios.get(`${BASE_URL}/books-data`);
        const allBooks = response.data;
        const matchingBooks = Object.keys(allBooks)
            .filter((isbn) => allBooks[isbn].author === author)
            .map((isbn) => ({
                isbn,
                author: allBooks[isbn].author,
                title: allBooks[isbn].title,
                reviews: allBooks[isbn].reviews
            }));

        if (matchingBooks.length > 0) {
            return res.status(200).send(JSON.stringify(matchingBooks, null, 4));
        }
        return handleError(res, { status: 404, message: "No books found for this author" });
    } catch (err) {
        return filterBooks('author', author)
            .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
            .catch((error) => handleError(res, error));
    }
});

/**
 * Task 13: Get all books based on Title using Promise callbacks with Axios and reusable filtering.
 */
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title;
    axios.get(`${BASE_URL}/books-data`)
        .then((response) => {
            const allBooks = response.data;
            const matchingBooks = Object.keys(allBooks)
                .filter((isbn) => allBooks[isbn].title === title)
                .map((isbn) => ({
                    isbn,
                    author: allBooks[isbn].author,
                    title: allBooks[isbn].title,
                    reviews: allBooks[isbn].reviews
                }));

            if (matchingBooks.length > 0) {
                return res.status(200).send(JSON.stringify(matchingBooks, null, 4));
            }
            return handleError(res, { status: 404, message: "No books found with this title" });
        })
        .catch(() => filterBooks('title', title)
            .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
            .catch((error) => handleError(res, error))
        );
});

/**
 * Get book review based on ISBN.
 */
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
    }
    return handleError(res, { status: 404, message: "ISBN not found" });
});

module.exports.general = public_users;
