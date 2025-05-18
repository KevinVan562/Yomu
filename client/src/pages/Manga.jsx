import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const Manga = () => {
  const { id } = useParams();
  const [manga, setManga] = useState(null); // State for manga details
  const [chapters, setChapters] = useState([]); // State for chapters
  const [stats, setStats] = useState(null); // State for stats
  const [currentPage, setCurrentPage] = useState(1);
  const chaptersPerPage = 50;

  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        const response = await fetch(`/api/manga-details?id=${id}`);
        const data = await response.json();
        setManga(data);

        const chaptersResponse = await fetch(`/api/manga-chapters?id=${id}`);
        const chaptersData = await chaptersResponse.json();
        setChapters(chaptersData);

        const statsResponse = await fetch(`/api/stats?id=${id}`);
        const statsData = await statsResponse.json();
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching manga data:", error);
      }
    };
    if (id) fetchMangaData();
  }, [id]);

  if (!manga || !chapters || !stats) {
    return <div className="p-4">Loading manga details...</div>;
  }

  const indexOfLastChapter = currentPage * chaptersPerPage;
  const indexOfFirstChapter = indexOfLastChapter - chaptersPerPage;
  const currentChapters =
    Array.isArray(chapters) && chapters.length > 0
      ? chapters.slice(indexOfFirstChapter, indexOfLastChapter)
      : [];
  const totalPages = Math.ceil(chapters.length / chaptersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{manga.title}</h1>
      <div className="flex items-start mb-6">
        {manga.cover ? (
          <img
            src={manga.cover}
            alt={manga.title}
            className="w-52 rounded shadow-md mr-6"
          />
        ) : (
          <div className="w-52 h-64 bg-gray-200 rounded shadow-md mr-6"></div>
        )}
        <div className="flex flex-col">
          <p>{manga.description || "No description available."}</p>
          <div className="mt-4 grid grid-cols-2 gap-6">
            <div className="flex flex-col">
              <p>
                <strong>Author(s):</strong>{" "}
                {manga.authors || "No author information available."}
              </p>
              <p>
                <strong>Type:</strong> {manga.type || "No type available."}
              </p>
              <p>
                <strong>Genres:</strong>{" "}
                {manga.genres
                  ? manga.genres.join(", ")
                  : "No genres available."}
              </p>
            </div>
            <div className="flex flex-col text-white">
              <div className="mt-0">
                {stats.meanRating && (
                  <p>
                    <strong>Mean Rating:</strong> {stats.meanRating.toFixed(2)}{" "}
                    / 10
                  </p>
                )}
                {stats.bayesianRating && (
                  <p>
                    <strong>Bayesian Rating:</strong>{" "}
                    {stats.bayesianRating.toFixed(2)} / 10
                  </p>
                )}
                {stats.follows !== undefined && (
                  <p>
                    <strong>Followers:</strong> {stats.follows}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chapters</h2>
        <div className="flex items-center">
          <span className="mr-2">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => currentPage > 1 && paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-purple-400 hover:bg-purple-700"
              }`}
            >
              Prev
            </button>
            <button
              onClick={() =>
                currentPage < totalPages && paginate(currentPage + 1)
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-purple-400 hover:bg-purple-700"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {chapters && chapters.length > 0 ? (
        <div>
          <ul className="space-y-3">
            {currentChapters.map((chapter) => (
              <li key={chapter.chapterId}>
                <Link
                  to={`/manga/${id}/viewer/${chapter.chapterId}`}
                  className="flex items-center p-3 bg-[#202020] rounded-lg hover:bg-[#363636] transition-all w-full"
                >
                  <span className="text-blue-500 font-semibold mr-4">
                    Chapter {chapter.chapterNumber}:
                  </span>
                  <span className="text-white hover:text-blue-300">
                    {chapter.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Bottom pagination for convenience */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              {[...Array(totalPages).keys()].map((number) => (
                <button
                  key={number + 1}
                  onClick={() => paginate(number + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === number + 1
                      ? "bg-purple-400"
                      : "bg-[#363636] hover:bg-[#464646]"
                  }`}
                >
                  {number + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p>No chapters available.</p>
      )}
    </div>
  );
};

export default Manga;
