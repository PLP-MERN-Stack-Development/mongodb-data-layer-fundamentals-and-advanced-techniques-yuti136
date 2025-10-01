// queries.js - Script to demonstrate MongoDB queries on the books collection

// Import MongoDB client
const { MongoClient } = require('mongodb');

// Connection URI (replace with your MongoDB URI if needed)
const uri = 'mongodb://localhost:27017';

// Database and collection names
const dbName = 'plp_bookstore';
const collectionName = 'books';

async function runQueries() {
  const client = new MongoClient(uri);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB server");

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // 1. Find all books in a specific genre
    const fictionBooks = await collection.find({ genre: "Fiction" }).toArray();
    console.log("\n1. Fiction books:");
    fictionBooks.forEach(book => console.log(`- ${book.title} by ${book.author}`));

    // 2. Find books published after a certain year
    const after1950 = await collection.find({ published_year: { $gt: 1950 } }).toArray();
    console.log("\n2. Books published after 1950:");
    after1950.forEach(book => console.log(`- ${book.title} (${book.published_year})`));

    // 3. Find books by a specific author
    const orwellBooks = await collection.find({ author: "George Orwell" }).toArray();
    console.log("\n3. Books by George Orwell:");
    orwellBooks.forEach(book => console.log(`- ${book.title} (${book.published_year})`));

    // 4. Update the price of a specific book
    const updateResult = await collection.updateOne(
      { title: "1984" },
      { $set: { price: 12.50 } }
    );
    console.log("\n4. Update result:", updateResult.modifiedCount > 0 ? "Price updated" : "No book updated");

    // 5. Delete a book by its title
    const deleteResult = await collection.deleteOne({ title: "Moby Dick" });
    console.log("\n5. Delete result:", deleteResult.deletedCount > 0 ? "Book deleted" : "No book deleted");


    // 1. Find books that are both in stock AND published after 2010
    const recentInStock = await collection.find({
      in_stock: true,
      published_year: { $gt: 2010 }
    }).toArray();

    console.log("\n1. Books in stock and published after 2010:");
    recentInStock.forEach(book => console.log(`- ${book.title} (${book.published_year})`));

    // 2. Use projection to return only title, author, and price
    const projectedBooks = await collection.find(
      {},
      { projection: { title: 1, author: 1, price: 1, _id: 0 } }
    ).toArray();

    console.log("\n2. Books with projection (title, author, price only):");
    projectedBooks.forEach(book => console.log(book));

    // 3. Sorting books by price (ascending)
    const sortedAsc = await collection.find({}, { projection: { title: 1, price: 1, _id: 0 } })
                                      .sort({ price: 1 }).toArray();
    console.log("\n3a. Books sorted by price (ascending):");
    sortedAsc.forEach(book => console.log(`${book.title}: $${book.price}`));

    // Sorting books by price (descending)
    const sortedDesc = await collection.find({}, { projection: { title: 1, price: 1, _id: 0 } })
                                       .sort({ price: -1 }).toArray();
    console.log("\n3b. Books sorted by price (descending):");
    sortedDesc.forEach(book => console.log(`${book.title}: $${book.price}`));

    // 4. Pagination: limit & skip (5 books per page)
    const page = 1; // Change this number to get page 1, 2, 3...
    const pageSize = 5;

    const paginatedBooks = await collection.find(
      {},
      { projection: { title: 1, author: 1, price: 1, _id: 0 } }
    )
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    console.log(`\n4. Page ${page} (5 books per page):`);
    paginatedBooks.forEach(book => console.log(book));  

    

    // 1. Average price of books by genre
    const avgPriceByGenre = await collection.aggregate([
      { $group: { _id: "$genre", averagePrice: { $avg: "$price" } } },
      { $sort: { averagePrice: -1 } } // optional: sort by avg price descending
    ]).toArray();

    console.log("\n1. Average price of books by genre:");
    avgPriceByGenre.forEach(item =>
      console.log(`${item._id}: $${item.averagePrice.toFixed(2)}`)
    );

    // 2. Author with the most books
    const mostBooksAuthor = await collection.aggregate([
      { $group: { _id: "$author", bookCount: { $sum: 1 } } },
      { $sort: { bookCount: -1 } },
      { $limit: 1 }
    ]).toArray();

    console.log("\n2. Author with the most books:");
    mostBooksAuthor.forEach(item =>
      console.log(`${item._id}: ${item.bookCount} books`)
    );

    // 3. Group books by publication decade and count them
    const booksByDecade = await collection.aggregate([
      { $project: { decade: { $multiply: [ { $floor: { $divide: ["$published_year", 10] } }, 10 ] } } },
      { $group: { _id: "$decade", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log("\n3. Books grouped by publication decade:");
    booksByDecade.forEach(item =>
      console.log(`${item._id}s: ${item.count} books`)
    );



    // 1. Create an index on the "title" field
    const titleIndex = await collection.createIndex({ title: 1 });
    console.log("\n1. Created index:", titleIndex);

    // 2. Create a compound index on "author" and "published_year"
    const compoundIndex = await collection.createIndex({ author: 1, published_year: -1 });
    console.log("2. Created compound index:", compoundIndex);

    // 3. Use explain() to demonstrate performance improvement
    console.log("\n3. Query without index (explain plan):");
    const noIndexExplain = await collection.find({ title: "1984" }).explain("executionStats");
    console.log("Documents examined:", noIndexExplain.executionStats.totalDocsExamined);
    console.log("Execution time (ms):", noIndexExplain.executionStats.executionTimeMillis);

    console.log("\nQuery with index (explain plan):");
    // Since the index is already created, same query should now use it
    const withIndexExplain = await collection.find({ title: "1984" }).explain("executionStats");
    console.log("Documents examined:", withIndexExplain.executionStats.totalDocsExamined);
    console.log("Execution time (ms):", withIndexExplain.executionStats.executionTimeMillis);

    

  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    // Close the connection
    await client.close();
    console.log("\nConnection closed");
  }
}

// Run the queries
runQueries().catch(console.error);


