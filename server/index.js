const express = require("express");
const app = express();
const cors = require("cors");
const { pipeline } = require("stream/promises");
const PORT = 5000;

app.use(cors());
app.use(express.json());
const router = express.Router();
const axios = require("axios");

app.get("/api/manga", async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const mangaResponse = await fetch(
      `https://api.mangadex.org/manga?limit=${limit}&offset=${offset}&includes[]=cover_art&includes[]=author&translatedLanguage[]=en`
    );

    console.log(`MangaDex API response status: ${mangaResponse.status}`);

    if (!mangaResponse.ok) {
      return res
        .status(500)
        .json({ error: `MangaDex API error: ${mangaResponse.status}` });
    }

    const mangaData = await mangaResponse.json();
    console.log("MangaDex API response data:", mangaData);

    if (!mangaData || !mangaData.data) {
      return res
        .status(500)
        .json({ error: "No manga data returned from MangaDex API" });
    }

    const mangaList = mangaData.data.map((manga) => {
      const coverRel = manga.relationships?.find(
        (rel) => rel.type === "cover_art"
      );
      const coverUrl = coverRel
        ? `/api/proxy-image?imageUrl=https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`
        : null;

      const title =
        manga.attributes.title.en ||
        manga.attributes.title["en-us"] ||
        Object.values(manga.attributes.title)[0] ||
        "No title available";
      const description =
        manga.attributes.description.en ||
        manga.attributes.description["en-us"] ||
        Object.values(manga.attributes.description)[0] ||
        "No description available";

      // Extract author information (if available)
      const authors = manga.relationships
        ? manga.relationships
            .filter((rel) => rel.type === "author")
            .map((authorRel) => authorRel.attributes.name)
        : [];

      return {
        id: manga.id,
        title: title,
        description: description,
        authors: authors,
        cover: coverUrl,
      };
    });

    return res.json(mangaList);
  } catch (error) {
    // Log the error for debugging
    console.error("Error fetching manga data:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching manga data" });
  }
});

// Route to get Manga Data (Title, description, author, type)
app.get("/api/manga-details", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Manga ID is required" });
    }

    // Fetch manga details using MangaDex API
    const mangaResponse = await fetch(
      `https://api.mangadex.org/manga/${id}?includes[]=cover_art&includes[]=author`
    );
    const mangaData = await mangaResponse.json();

    if (!mangaData || !mangaData.data) {
      return res.status(500).json({ error: "Failed to fetch manga details" });
    }

    const manga = mangaData.data;
    const coverRel = manga.relationships.find(
      (rel) => rel.type === "cover_art"
    );
    let coverUrl = null;
    if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
      coverUrl = `/api/proxy-image?imageUrl=https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
    }

    // Find author(s) from relationships
    const authors = manga.relationships
      .filter((rel) => rel.type === "author")
      .map((rel) => rel.attributes.name);

    const title =
      manga.attributes.title.en ||
      manga.attributes.title["en-us"] ||
      Object.values(manga.attributes.title)[0] ||
      "No title available";

    const description =
      manga.attributes.description.en ||
      manga.attributes.description["en-us"] ||
      Object.values(manga.attributes.description)[0] ||
      "No description available";

    const genres = manga.attributes.tags
      .filter((tag) => tag.attributes.group === "genre")
      .map(
        (tag) => tag.attributes.name.en || Object.values(tag.attributes.name)[0]
      );

    const mangaDetails = {
      id: manga.id,
      title: title,
      cover: coverUrl,
      updatedAt: manga.attributes.updatedAt,
      description: description,
      authors: authors.join(", "),
      type: manga.attributes.contentRating || "No content rating available",
      genres: genres,
    };

    res.json(mangaDetails);
  } catch (error) {
    console.error("Error fetching manga details:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching manga details" });
  }
});

// Route to get stats
app.get("/api/stats", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Please provide a manga ID" });
  }

  try {
    const response = await fetch(
      `https://api.mangadex.org/statistics/manga/${id}`
    );
    const data = await response.json();

    if (!data.statistics || !data.statistics[id]) {
      return res
        .status(404)
        .json({ error: "No statistics found for that manga ID" });
    }

    const { rating, follows } = data.statistics[id];

    res.json({
      meanRating: rating.average,
      bayesianRating: rating.bayesian,
      follows: follows,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching statistics" });
  }
});

app.get("/api/manga-chapters", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Manga ID is required" });
  }

  try {
    const url = `https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&limit=500&order[chapter]=desc&includes[]=scanlation_group`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return res
        .status(404)
        .json({ error: "No chapters found for this manga" });
    }

    const chapters = data.data.map((chapter) => ({
      chapterId: chapter.id,
      chapterNumber: chapter.attributes.chapter,
      title: chapter.attributes.title,
      scanlationGroup:
        chapter.relationships.find((rel) => rel.type === "scanlation_group")
          ?.attributes?.name || "Unknown",
      publishedAt: chapter.attributes.publishAt,
    }));

    res.json(chapters);
  } catch (error) {
    console.error("Error fetching manga chapters:", error);
    res.status(500).json({ error: "Failed to fetch manga chapters" });
  }
});

// Route for getting specific manga chapter images
app.get("/api/manga/:id/chapter/:chapterId", async (req, res) => {
  const mangaId = req.params.id;
  const chapterId = req.params.chapterId;

  try {
    const chapterDetailsUrl = `https://api.mangadex.org/at-home/server/${chapterId}`;
    const chapterDetailsResponse = await fetch(chapterDetailsUrl);
    const chapterDetailsData = await chapterDetailsResponse.json();

    if (
      !chapterDetailsData.baseUrl ||
      !chapterDetailsData.chapter ||
      !chapterDetailsData.chapter.data
    ) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const baseUrl = chapterDetailsData.baseUrl;
    const chapterHash = chapterDetailsData.chapter.hash;

    const images = chapterDetailsData.chapter.data.map((filename) => {
      const imageUrl = `${baseUrl}/data/${chapterHash}/${filename}`;
      return `/api/proxy-image?imageUrl=${encodeURIComponent(imageUrl)}`;
    });

    res.json({ chapterId, images });
  } catch (error) {
    console.error("Error fetching manga chapter images:", error);
    res.status(500).json({ error: "Failed to fetch chapter images" });
  }
});

app.get("/api/recently-updated", async (req, res) => {
  try {
    let uniqueMangaIds = [];
    let offset = 0;
    const limit = 100;

    while (uniqueMangaIds.length < 10) {
      const chaptersResponse = await fetch(
        `https://api.mangadex.org/chapter?order[updatedAt]=desc&limit=${limit}&offset=${offset}&includes[]=manga&translatedLanguage[]=en`,
        {
          headers: {
            "User-Agent": "Yomu/1.0",
            Accept: "application/json",
          },
        }
      );

      const chaptersData = await chaptersResponse.json();

      if (
        !chaptersData ||
        !chaptersData.data ||
        chaptersData.data.length === 0
      ) {
        console.log("No more chapters available or API error");
        break;
      }

      const newMangaIds = [
        ...new Set(
          chaptersData.data
            .map(
              (chapter) =>
                chapter.relationships.find((rel) => rel.type === "manga")?.id
            )
            .filter((id) => id)
        ),
      ];

      uniqueMangaIds = [...new Set([...uniqueMangaIds, ...newMangaIds])];
      console.log(
        `Total unique manga IDs found so far: ${uniqueMangaIds.length}`
      );

      offset += limit;

      if (offset >= 500) {
        console.log("Reached maximum fetch attempts, breaking");
        break;
      }
    }

    // Take the first 10 (or all available if less than 10)
    const finalMangaIds = uniqueMangaIds.slice(
      0,
      Math.min(10, uniqueMangaIds.length)
    );
    console.log(`Using ${finalMangaIds.length} manga IDs for detail fetch`);

    const mangaResponse = await fetch(
      `https://api.mangadex.org/manga?ids[]=${finalMangaIds.join(
        "&ids[]="
      )}&includes[]=cover_art`,
      {
        headers: {
          "User-Agent": "MyMangaApp/1.0",
          Accept: "application/json",
        },
      }
    );
    const mangaData = await mangaResponse.json();

    if (!mangaData || !mangaData.data) {
      return res.status(500).json({ error: "Failed to fetch manga details" });
    }

    const mangaList = mangaData.data
      .map((manga) => {
        // Find the cover relationship
        const coverRel = manga.relationships.find(
          (rel) => rel.type === "cover_art"
        );
        let coverUrl = null;
        if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
          coverUrl = `/api/proxy-image?imageUrl=https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
        }

        const title =
          manga.attributes.title.en ||
          manga.attributes.title["en-us"] ||
          Object.values(manga.attributes.title)[0] ||
          "No title available";

        // Get the description for the manga
        const description =
          manga.attributes.description.en ||
          manga.attributes.description["en-us"] ||
          Object.values(manga.attributes.description)[0] ||
          "No description available";

        return {
          id: manga.id,
          title: title,
          cover: coverUrl,
          updatedAt: manga.attributes.updatedAt,
          description: description,
        };
      })
      .filter((manga) => manga.cover !== null);

    // If we still don't have enough manga, try an another approach
    if (mangaList.length < 10) {
      console.log(
        "Not enough manga with covers, fetching directly from manga endpoint"
      );
      // Fallback: Get recent manga directly
      const fallbackResponse = await fetch(
        "https://api.mangadex.org/manga?order[updatedAt]=desc&limit=10&includes[]=cover_art",
        {
          headers: {
            "User-Agent": "MyMangaApp/1.0",
            Accept: "application/json",
          },
        }
      );
      const fallbackData = await fallbackResponse.json();

      if (fallbackData && fallbackData.data) {
        const fallbackMangaList = fallbackData.data
          .map((manga) => {
            const coverRel = manga.relationships.find(
              (rel) => rel.type === "cover_art"
            );
            let coverUrl = null;
            if (
              coverRel &&
              coverRel.attributes &&
              coverRel.attributes.fileName
            ) {
              coverUrl = `/api/proxy-image?imageUrl=https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
            }

            const title =
              manga.attributes.title.en ||
              manga.attributes.title["en-us"] ||
              Object.values(manga.attributes.title)[0] ||
              "No title available";

            const description =
              manga.attributes.description.en ||
              manga.attributes.description["en-us"] ||
              Object.values(manga.attributes.description)[0] ||
              "No description available";

            return {
              id: manga.id,
              title: title,
              cover: coverUrl,
              updatedAt: manga.attributes.updatedAt,
              description: description,
            };
          })
          .filter((manga) => manga.cover !== null);

        const combinedList = [...mangaList];

        for (const fallbackManga of fallbackMangaList) {
          if (!combinedList.some((manga) => manga.id === fallbackManga.id)) {
            combinedList.push(fallbackManga);
          }
        }

        console.log(`Combined manga list length: ${combinedList.length}`);
        return res.json(
          combinedList.slice(0, Math.min(combinedList.length, 10))
        );
      }
    }

    res.json(mangaList);
  } catch (error) {
    console.error("Error fetching recently updated manga:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching recent manga" });
  }
});

app.get("/api/popular-manga", async (req, res) => {
  try {
    let offset = 0;
    const limit = 10;

    // Fetch popular manga based on update date
    const mangaResponse = await fetch(
      `https://api.mangadex.org/manga?order[updatedAt]=desc&limit=${limit}&offset=${offset}&includes[]=cover_art`,
      {
        headers: {
          "User-Agent": "MyMangaApp/1.0",
          Accept: "application/json",
        },
      }
    );

    const mangaData = await mangaResponse.json();

    console.log("MangaDex Response Data:", mangaData);

    if (!mangaData || !mangaData.data || mangaData.data.length === 0) {
      return res
        .status(500)
        .json({ error: "Failed to fetch popular manga or no data available" });
    }

    const mangaList = mangaData.data.map((manga) => {
      const coverRel = manga.relationships.find(
        (rel) => rel.type === "cover_art"
      );
      let coverUrl = null;

      if (coverRel && coverRel.attributes && coverRel.attributes.fileName) {
        coverUrl = `/api/proxy-image?imageUrl=https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
      }

      const title =
        manga.attributes.title.en ||
        manga.attributes.title["en-us"] ||
        Object.values(manga.attributes.title)[0] ||
        "No title available";

      const description =
        manga.attributes.description.en ||
        manga.attributes.description["en-us"] ||
        Object.values(manga.attributes.description)[0] ||
        "No description available";

      return {
        id: manga.id,
        title: title,
        cover: coverUrl,
        updatedAt: manga.attributes.updatedAt,
        description: description,
      };
    });

    res.json(mangaList);
  } catch (error) {
    console.error("Error fetching popular manga:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching popular manga" });
  }
});

app.get("/manga/popular-recent", async (req, res) => {
  try {
    // Fix date formatting for createdAtSince
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const year = oneYearAgo.getFullYear();
    const month = String(oneYearAgo.getMonth() + 1).padStart(2, "0");
    const day = String(oneYearAgo.getDate()).padStart(2, "0");
    const hours = String(oneYearAgo.getHours()).padStart(2, "0");
    const minutes = String(oneYearAgo.getMinutes()).padStart(2, "0");
    const seconds = String(oneYearAgo.getSeconds()).padStart(2, "0");

    const createdAtSince = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    // 1. Fetch Manga
    const mangaResponse = await axios.get("https://api.mangadex.org/manga", {
      params: {
        createdAtSince: createdAtSince,
        limit: 10,
        includes: ["author", "artist", "cover_art"], // so we get authors + cover
        order: { followedCount: "desc" },
      },
    });

    const mangaList = mangaResponse.data.data;

    // 2. Format the response
    const formattedManga = mangaList.map((manga) => {
      const attributes = manga.attributes;

      const title =
        attributes.title.en || Object.values(attributes.title)[0] || "No Title";
      const description =
        attributes.description.en ||
        Object.values(attributes.description)[0] ||
        "No Description";

      const tags = attributes.tags
        .map((tag) => tag.attributes.name.en)
        .filter(Boolean);

      // Find author
      const authorRel = manga.relationships.find(
        (rel) => rel.type === "author"
      );
      const author = authorRel
        ? authorRel.attributes?.name || "Unknown Author"
        : "Unknown Author";

      // Find cover art
      const coverRel = manga.relationships.find(
        (rel) => rel.type === "cover_art"
      );
      const coverFilename = coverRel ? coverRel.attributes?.fileName : null;
      const mangaId = manga.id;
      const coverUrl = coverFilename
        ? `/api/proxy-image?imageUrl=${encodeURIComponent(
            `https://uploads.mangadex.org/covers/${mangaId}/${coverFilename}.512.jpg`
          )}`
        : null;

      return {
        mangaId, // Add mangaId here
        title,
        description,
        author,
        genres: tags,
        coverImage: coverUrl,
      };
    });

    res.json(formattedManga);
  } catch (error) {
    console.error(
      "Error fetching manga:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch manga." });
  }
});

// Search route
router.get("/search", async (req, res) => {
  const query = req.query.query;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  if (!query || query.trim().length < 3) {
    return res
      .status(400)
      .json({ error: "Search query must be at least 3 characters" });
  }

  try {
    // Step 1: Search for manga by title
    const searchResponse = await axios.get("https://api.mangadex.org/manga", {
      params: {
        title: query,
        limit: limit,
        offset: offset,
        includes: ["cover_art"], // Add this to include cover art data
      },
    });

    const total = searchResponse.data.total;

    // Parse the response
    const resultsWithDescription = searchResponse.data.data.map((manga) => {
      // Extract title
      const title =
        manga.attributes.title.en ||
        manga.attributes.title.ja_ro ||
        Object.values(manga.attributes.title)[0] ||
        "Unknown Title";

      // Extract description
      const description =
        manga.attributes.description?.en || "No description available";

      // Extract cover image
      let cover = null;
      const coverRel = manga.relationships?.find(
        (rel) => rel.type === "cover_art"
      );
      if (coverRel) {
        const fileName = coverRel.attributes?.fileName;
        if (fileName) {
          cover = `/api/proxy-image?imageUrl=${encodeURIComponent(
            `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`
          )}`;
        }
      }

      return {
        id: manga.id,
        title,
        description,
        cover,
      };
    });

    res.json(resultsWithDescription);
    res.json({
      mangas: resultsWithDescription,
      pagination: {
        currentOffset: offset,
        limit: limit,
        total: total,
      },
    });
  } catch (error) {
    console.error("Error fetching MangaDex API:", error);
    res.status(500).json({ error: "Failed to fetch manga details" });
  }
});

// Proxy to get image
app.get("/api/proxy-image", async (req, res) => {
  const { imageUrl } = req.query;

  if (!imageUrl) {
    return res.status(400).json({ error: "No image URL provided" });
  }

  try {
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });

    if (!imageResponse.ok || !imageResponse.body) {
      return res.status(500).json({ error: "Failed to fetch image" });
    }

    res.setHeader("Content-Type", imageResponse.headers.get("content-type"));
    res.setHeader("Cache-Control", "public, max-age=86400");

    // Now stream
    await pipeline(imageResponse.body, res);
  } catch (error) {
    console.error("Error streaming image:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error streaming image" });
    }
  }
});

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
