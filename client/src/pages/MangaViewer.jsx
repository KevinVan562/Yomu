import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const MangaViewer = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [chapterList, setChapterList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        const response = await fetch(`/api/manga-chapters?id=${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch chapters");
        }
        const data = await response.json();
        setChapterList(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchChapters();
  }, [id]);

  useEffect(() => {
    const fetchChapterImages = async () => {
      if (!id || !chapterId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/manga/${id}/chapter/${chapterId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch images");
        }
        const data = await response.json();
        setImages(data.images);
        setLoading(false);
        window.scrollTo(0, 0);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchChapterImages();
  }, [id, chapterId]);

  // Find the index of the current chapter
  const getCurrentChapterIndex = () => {
    return chapterList.findIndex((chapter) => chapter.chapterId === chapterId);
  };

  const currentIndex = getCurrentChapterIndex();
  const currentChapter = currentIndex !== -1 ? chapterList[currentIndex] : null;

  // Get next and previous chapters based on newest first order
  const prevChapter =
    currentIndex < chapterList.length - 1
      ? chapterList[currentIndex + 1]
      : null; // The previous chapter is at the next index
  const nextChapter = currentIndex > 0 ? chapterList[currentIndex - 1] : null; // The next chapter is at the previous index

  // Navigate to next or previous chapter
  const goToNextChapter = () => {
    if (nextChapter) {
      navigate(`/manga/${id}/viewer/${nextChapter.chapterId}`);
    }
  };

  const goToPrevChapter = () => {
    if (prevChapter) {
      navigate(`/manga/${id}/viewer/${prevChapter.chapterId}`);
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="flex flex-col items-center p-4">
      {/* Buttons at the top */}
      <div className="flex justify-center gap-4 mt-4 mb-4">
        <button
          onClick={goToPrevChapter}
          disabled={!prevChapter}
          className={`px-4 py-2 rounded ${
            prevChapter
              ? "bg-[#363636] hover:bg-purple-400 text-white"
              : "bg-[#363636] text-gray-500 cursor-not-allowed"
          }`}
        >
          Prev
        </button>

        <button
          onClick={goToNextChapter}
          disabled={!nextChapter}
          className={`px-4 py-2 rounded ${
            nextChapter
              ? "bg-[#363636] hover:bg-purple-400 text-white"
              : "bg-[#363636] text-gray-500 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>

      {/* Title - Using the chapter's own number if available */}
      {currentChapter && (
        <h2 className="text-2xl font-bold mb-4 text-center">
          {currentChapter.chapterNumber
            ? `Chapter ${currentChapter.chapterNumber}`
            : `Chapter ${currentChapter.chapterId}`}{" "}
          {currentChapter.title ? `- ${currentChapter.title}` : ""}
        </h2>
      )}

      {/* Images */}
      <div className="flex flex-col items-center gap-0">
        {images.length > 0 ? (
          images.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Page ${index + 1}`}
              className="w-full max-w-7xl"
            />
          ))
        ) : (
          <p>No images available for this chapter</p>
        )}
      </div>

      {/* Buttons at the bottom */}
      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={goToPrevChapter}
          disabled={!prevChapter}
          className={`px-4 py-2 rounded ${
            prevChapter
              ? "bg-[#363636] hover:bg-purple-400 text-white"
              : "bg-[#363636] text-gray-500 cursor-not-allowed"
          }`}
        >
          Prev
        </button>

        <button
          onClick={goToNextChapter}
          disabled={!nextChapter}
          className={`px-4 py-2 rounded ${
            nextChapter
              ? "bg-[#363636] hover:bg-purple-400 text-white"
              : "bg-[#363636] text-gray-500 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default MangaViewer;
