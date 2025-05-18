import React, { useState, useEffect } from "react";
import MangaCarousel from "../components/MangaCarousel";
import MangaHero from "../components/MangaHero";
import axios from "axios";

function Home() {
  const [featuredManga, setFeaturedManga] = useState([]);
  const [popularManga, setPopularManga] = useState([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [heroData, setHeroData] = useState([]);
  const [isLoadingHero, setIsLoadingHero] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState(null);
  const [errorPopular, setErrorPopular] = useState(null);
  const [errorHero, setErrorHero] = useState(null);

  useEffect(() => {
    // Fetch the recently updated manga
    const fetchRecentlyUpdated = async () => {
      try {
        setIsLoadingFeatured(true);
        const response = await fetch("/api/recently-updated");
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        const data = await response.json();
        console.log(
          "Total recently updated manga items received:",
          data.length
        );
        setFeaturedManga(data);
      } catch (err) {
        console.error("Error fetching recently updated manga:", err);
        setErrorFeatured(err.message);
      } finally {
        setIsLoadingFeatured(false);
      }
    };
    fetchRecentlyUpdated();
  }, []);

  useEffect(() => {
    const fetchPopularManga = async () => {
      try {
        setIsLoadingPopular(true);
        const response = await fetch("/api/popular-manga");
        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Total popular manga items received:", data.length);
        setPopularManga(data);
      } catch (err) {
        console.error("Error fetching popular manga:", err);
        setErrorPopular(err.message);
      } finally {
        setIsLoadingPopular(false);
      }
    };
    fetchPopularManga();
  }, []);

  useEffect(() => {
    const fetchHeroManga = async () => {
      try {
        setIsLoadingHero(true);
        const response = await axios.get("/manga/popular-recent");
        setHeroData(response.data);
      } catch (err) {
        console.error("Error fetching hero manga data:", err);
        setErrorHero("Failed to fetch featured manga data.");
      } finally {
        setIsLoadingHero(false);
      }
    };

    fetchHeroManga();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      {isLoadingHero ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-white text-lg">Loading featured manga...</p>
        </div>
      ) : errorHero ? (
        <div className="bg-red-500 text-white p-4 rounded-md">
          <p>Error loading featured manga: {errorHero}</p>
        </div>
      ) : (
        <MangaHero heroData={heroData} />
      )}

      {/* Content sections */}
      <div className="container mx-auto px-4">
        {/* Recently Updated Manga Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 mt-10">
            Recently Updated
          </h2>
          {isLoadingFeatured ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-white text-lg">
                Loading recently updated manga...
              </p>
            </div>
          ) : errorFeatured ? (
            <div className="bg-red-500 text-white p-4 rounded-md">
              <p>Error loading recently updated manga: {errorFeatured}</p>
            </div>
          ) : (
            <MangaCarousel featuredManga={featuredManga} />
          )}
        </section>

        {/* Popular Manga Section */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4 mt-10">
            Popular Manga
          </h2>
          {isLoadingPopular ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-white text-lg">Loading popular manga...</p>
            </div>
          ) : errorPopular ? (
            <div className="bg-red-500 text-white p-4 rounded-md">
              <p>Error loading popular manga: {errorPopular}</p>
            </div>
          ) : (
            <MangaCarousel featuredManga={popularManga} />
          )}
        </section>
      </div>
    </div>
  );
}

export default Home;
