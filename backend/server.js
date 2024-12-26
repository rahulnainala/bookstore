const express = require("express");
const cors = require("cors");
const {
  getBooks,
  getBookById,
  addBook,
  updateBook,
  deleteBook,
} = require("./db/queries");

const app = express();
app.use(cors());
app.use(express.json());

// Get all books
app.get("/api/books", async (req, res) => {
  try {
    const books = await getBooks();
    res.json(books);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get book by ID
app.get("/api/books/:id", async (req, res) => {
  try {
    const book = await getBookById(req.params.id);
    if (!book) return res.status(404).send("Book not found");
    res.json(book);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add a new book
app.post("/api/books", async (req, res) => {
  const { title, authorId, genre, publishedDate } = req.body;
  try {
    const newBook = await addBook(title, authorId, genre, publishedDate);
    res.status(201).json(newBook);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update a book
app.put("/api/books/:id", async (req, res) => {
  const { title, authorId, genre, publishedDate } = req.body;
  try {
    const updatedBook = await updateBook(
      req.params.id,
      title,
      authorId,
      genre,
      publishedDate
    );
    if (!updatedBook) return res.status(404).send("Book not found");
    res.json(updatedBook);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete a book
app.delete("/api/books/:id", async (req, res) => {
  try {
    const deletedBook = await deleteBook(req.params.id);
    if (!deletedBook) return res.status(404).send("Book not found");
    res.json(deletedBook);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Start the server
const PORT = process.env.PORT || 5300;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
