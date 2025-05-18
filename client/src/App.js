import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./index.css";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Manga from "./pages/Manga";
import MangaViewer from "./pages/MangaViewer";
import SearchResults from "./pages/SearchResults";

function App() {
  return (
    <Router>
      <div className="w-full h-full">
        <Navbar />
        <div className="max-w-screen-xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/manga/:id" element={<Manga />} />
            <Route
              path="/manga/:id/viewer/:chapterId"
              element={<MangaViewer />}
            />
            <Route path="/search" element={<SearchResults />}></Route>
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
