import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import MangaGrid from "../components/MangaGrid";

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page")) || 1;

  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) return;

      setIsLoading(true);
      setError(null);

      const offset = (currentPage - 1) * ITEMS_PER_PAGE;

      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(
            query
          )}&limit=${ITEMS_PER_PAGE}&offset=${offset}`
        );

        if (!response.ok) {
          throw new Error(`Search failed with status: ${response.status}`);
        }

        const data = await response.json();
        console.log("API response:", data); // Debug log

        // Handle different response formats
        if (Array.isArray(data)) {
          // If the response is just an array of manga
          setSearchResults(data);
          // We don't know the total, so we'll only set it if we have it
        } else if (
          data.mangas &&
          data.pagination &&
          typeof data.pagination.total === "number"
        ) {
          // If response has the expected format with pagination
          setSearchResults(data.mangas);
          setTotalResults(data.pagination.total);
        } else {
          // Some other format - try to extract manga data
          setSearchResults(data.data || data.results || data);
          // Only set totalResults if we have an explicit count
          if (typeof data.total === "number") {
            setTotalResults(data.total);
          } else if (typeof data.count === "number") {
            setTotalResults(data.count);
          }
        }
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;

    // If we know the total, enforce upper limit
    if (totalResults > 0) {
      const maxPage = Math.ceil(totalResults / ITEMS_PER_PAGE);
      if (newPage > maxPage) return;
    } else {
      // If we don't know the total, only allow going to next page if current page has full results
      if (newPage > currentPage && searchResults.length < ITEMS_PER_PAGE)
        return;
    }

    setSearchParams({ q: query, page: newPage.toString() });
  };

  // Only calculate totalPages if we know the total
  const totalPages =
    totalResults > 0
      ? Math.max(1, Math.ceil(totalResults / ITEMS_PER_PAGE))
      : null;
  // Determine if we might have more pages
  const hasMorePages = searchResults.length === ITEMS_PER_PAGE;

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold text-white mb-4">
        Search Results for: <span className="text-purple-400">"{query}"</span>
      </h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-white text-lg">
            <i className="bx bx-loader-alt bx-spin mr-2"></i>
            Searching...
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-500 text-white p-4 rounded-md">
          <p>Error searching manga: {error}</p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="text-center text-gray-400 py-16">
          <i className="bx bx-search-alt text-5xl"></i>
          <p className="mt-4 text-xl">No results found for "{query}"</p>
          <p className="mt-2">
            Try a different search term or check your spelling
          </p>
        </div>
      ) : (
        <>
          <MangaGrid mangas={searchResults} />

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-8 mb-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 mx-2 rounded ${
                currentPage === 1
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-700"
              } text-white transition duration-300`}
            >
              Previous
            </button>

            <div className="mx-4 text-white">
              {totalPages
                ? `Page ${currentPage} of ${totalPages}`
                : `Page ${currentPage}`}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={
                !hasMorePages && totalPages && currentPage >= totalPages
              }
              className={`px-4 py-2 mx-2 rounded ${
                !hasMorePages && totalPages && currentPage >= totalPages
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-700"
              } text-white transition duration-300`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SearchResults;
