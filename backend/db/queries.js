const db = require("./db");

// Fetch all books
const getBooks = async () => {
  const result = await db.query("SELECT * FROM Books");
  return result.rows;
};

// Fetch a book by ID
const getBookById = async (id) => {
  const result = await db.query("SELECT * FROM Books WHERE booksId = $1", [id]);
  return result.rows[0];
};

// Add a new book
const addBook = async (title, authorId, genre, publishedDate) => {
  const result = await db.query(
    `INSERT INTO Books (title, authorId, genre, published_date) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, authorId, genre, publishedDate]
  );
  return result.rows[0];
};

// Update a book
const updateBook = async (id, title, authorId, genre, publishedDate) => {
  const result = await db.query(
    `UPDATE Books 
     SET title = $1, authorId = $2, genre = $3, published_date = $4 
     WHERE booksId = $5 RETURNING *`,
    [title, authorId, genre, publishedDate, id]
  );
  return result.rows[0];
};

// Delete a book
const deleteBook = async (id) => {
  const result = await db.query(
    `DELETE FROM Books WHERE booksId = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
};

module.exports = {
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
};
