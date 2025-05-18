import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setShowDropdown(false);
  }, [location.pathname]);

  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsNavbarVisible(scrollPosition <= lastScrollY);
      setLastScrollY(scrollPosition);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        searchManga(searchQuery);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const searchManga = async (query) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults(data.slice(0, 5)); // Limit to 5 results for the dropdown
      setShowDropdown(true);
    } catch (error) {
      console.error("Error searching manga:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleResultClick = (mangaId) => {
    navigate(`/manga/${mangaId}`);
    setShowDropdown(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* Navbar */}
      <header
        className={`flex items-center justify-between px-4 md:px-12 py-2 bg-[#1a1a1a] border-b border-purple-400 text-white relative transition-all duration-300 ${
          isNavbarVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full"
        }`}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
        }}
      >
        {/* Left: Hamburger */}
        <i
          className="bx bx-menu text-3xl cursor-pointer transition-transform duration-300 hover:scale-110 hover:text-purple-400"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        ></i>

        {/* Center: Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="font-bold text-lg md:text-xl tracking-wide">
            <span className="inline-block transition-transform duration-300 ease-in-out hover:scale-110 hover:text-purple-400">
              <Link to="/">Yomu</Link>
            </span>
          </h1>
        </div>

        {/* Right: Search */}
        <div className="flex items-center gap-4">
          {/* Desktop Search Bar */}
          <div
            ref={searchRef}
            className="relative hidden md:flex items-center w-64"
          >
            <form onSubmit={handleSearchSubmit} className="w-full">
              <i className="bx bx-search absolute left-3 text-xl text-gray-400 mt-[0.25rem]"></i>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full py-1.5 pl-10 pr-3 rounded bg-[#2a2a2a]/80 text-white placeholder-gray-400 border border-transparent focus:border-purple-400 focus:outline-none"
                onFocus={() => {
                  if (searchResults.length > 0) setShowDropdown(true);
                }}
              />
            </form>

            {/* Search Results Dropdown */}
            {showDropdown && (
              <div className="absolute top-full left-0 w-full mt-1 bg-[#2a2a2a] border border-gray-700 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-400">
                    <i className="bx bx-loader-alt bx-spin mr-2"></i>
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div>
                    {searchResults.map((manga) => (
                      <div
                        key={manga.id}
                        className="flex items-center p-2 hover:bg-[#363636] cursor-pointer"
                        onClick={() => handleResultClick(manga.id)}
                      >
                        <div className="w-12 h-16 mr-3 flex-shrink-0">
                          {manga.cover ? (
                            <img
                              src={manga.cover}
                              alt={manga.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-600 rounded flex items-center justify-center">
                              <i className="bx bx-image text-gray-400"></i>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="text-white text-sm font-medium truncate">
                            {manga.title}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 text-center border-t border-gray-700">
                      <button
                        className="text-purple-400 hover:underline text-sm"
                        onClick={() => {
                          navigate(
                            `/search?q=${encodeURIComponent(
                              searchQuery.trim()
                            )}`
                          );
                          setShowDropdown(false);
                        }}
                      >
                        View all results
                      </button>
                    </div>
                  </div>
                ) : searchQuery.trim().length >= 3 ? (
                  <div className="p-4 text-center text-gray-400">
                    No results found
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Mobile Search Icon */}
          <i
            className="bx bx-search text-2xl cursor-pointer md:hidden transition-transform duration-300 hover:scale-110 hover:text-purple-400"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          ></i>
        </div>
      </header>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div
          ref={searchRef}
          className="absolute top-[64px] left-0 w-full bg-[#202020] border-t border-purple-400 px-4 py-2 z-40 md:hidden"
        >
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <i className="bx bx-search text-xl text-gray-400 mr-2"></i>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full py-1.5 px-3 rounded bg-[#2a2a2a]/80 text-white placeholder-gray-400 border border-transparent focus:border-purple-400 focus:outline-none"
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
            />
            <i
              className="bx bx-x text-2xl ml-3 cursor-pointer hover:text-purple-400"
              onClick={() => {
                setIsSearchOpen(false);
                setShowDropdown(false);
              }}
            ></i>
          </form>

          {/* Mobile Search Results Dropdown */}
          {showDropdown && (
            <div className="w-full mt-1 bg-[#2a2a2a] border border-gray-700 rounded shadow-lg z-50 max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-400">
                  <i className="bx bx-loader-alt bx-spin mr-2"></i>
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  {searchResults.map((manga) => (
                    <div
                      key={manga.id}
                      className="flex items-center p-2 hover:bg-[#363636] cursor-pointer"
                      onClick={() => handleResultClick(manga.id)}
                    >
                      <div className="w-12 h-16 mr-3 flex-shrink-0">
                        {manga.cover ? (
                          <img
                            src={manga.cover}
                            alt={manga.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-600 rounded flex items-center justify-center">
                            <i className="bx bx-image text-gray-400"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="text-white text-sm font-medium truncate">
                          {manga.title}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="p-2 text-center border-t border-gray-700">
                    <button
                      className="text-purple-400 hover:underline text-sm"
                      onClick={() => {
                        navigate(
                          `/search?q=${encodeURIComponent(searchQuery.trim())}`
                        );
                        setShowDropdown(false);
                      }}
                    >
                      View all results
                    </button>
                  </div>
                </div>
              ) : searchQuery.trim().length >= 3 ? (
                <div className="p-4 text-center text-gray-400">
                  No results found
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#242424] p-6 flex flex-col gap-6 transform ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-500 ease-in-out z-50`}
      >
        {/* Close Button inside sidebar */}
        <button
          className="self-end text-3xl text-gray-400 hover:text-purple-400"
          onClick={() => setIsMenuOpen(false)}
        >
          &times;
        </button>

        {/* Sidebar Links */}
        <Link
          to="/"
          className="block p-2 text-lg hover:bg-[#363636] hover:text-gray-300"
          onClick={handleLinkClick}
        >
          Home
        </Link>
        <Link
          to="/MangaList"
          className="block p-2 text-lg hover:bg-[#363636] hover:text-gray-300"
          onClick={handleLinkClick}
        >
          Manga List
        </Link>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-500 ${
          isMenuOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        } z-40`}
        onClick={() => setIsMenuOpen(false)}
      ></div>
    </>
  );
}

export default Navbar;
