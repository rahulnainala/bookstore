import React, { useEffect, useState } from "react";
import axios from "axios";

const App = () => {
  const [apiData, setApiData] = useState([]);

  useEffect(() => {
    const apiCall = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/books/");
        setApiData(response.data);
      } catch (error) {
        console.error("API Error:", error.message);
      }
    };
    apiCall();
  }, []);

  return (
    <div style={{ marginLeft: "20px" }}>
      <h2>Book List</h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {apiData.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "20px",
              justifyContent: "center",
              border: "1px solid #ddd",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <p>
              <strong>Title:</strong> {item.title}
            </p>
            <p>
              <strong>Author ID:</strong> {item.authorid}
            </p>
            <p>
              <strong>Genre:</strong> {item.genre}
            </p>
            <p>
              <strong>Published Date:</strong> {item.published_date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
