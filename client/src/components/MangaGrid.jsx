import React from "react";
import { Link } from "react-router-dom";

const MangaGrid = ({ mangas }) => {
  if (!mangas || mangas.length === 0) {
    return <p>No mangas available to display.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
      {mangas.map((manga) => (
        <div key={manga.id} className="manga-item relative group">
          {/* Manga Item Container */}
          <div className="bg-transparent rounded-sm overflow-hidden transition duration-300">
            {/* Image with Hover Overlay */}
            <div className="relative w-full h-0 pb-[150%]">
              {" "}
              {/* Aspect ratio of 2:3 */}
              <Link
                to={`/manga/${manga.id}`}
                className="absolute top-0 left-0 w-full h-full z-10"
              >
                <img
                  src={manga.cover}
                  alt={manga.title}
                  className="w-full h-full object-cover rounded-md"
                  draggable="false"
                />
              </Link>
              <Link
                to={`/manga/${manga.id}`}
                className="absolute top-0 left-0 w-full h-full flex flex-col justify-between items-center p-4 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                <div
                  className="flex-1 overflow-auto text-white text-sm"
                  style={{
                    maxHeight: "270px",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {manga.description}
                </div>

                {/* Read Me Button */}
                <div className="pb-4">
                  <button className="px-4 py-2 bg-purple-500 text-white text-sm font-semibold rounded hover:bg-purple-700 transition duration-300">
                    Read Me
                  </button>
                </div>
              </Link>
            </div>

            {/* Manga Title */}
            <div className="p-4 text-center bg-transparent">
              <p className="text-white text-sm font-semibold line-clamp-2">
                {manga.title}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MangaGrid;
