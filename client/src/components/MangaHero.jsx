import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const MangaHero = ({ heroData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  // Embla carousel hook
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Update selected index when slide changes
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Track drag state to prevent navigation when dragging
  const onPointerDown = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onPointerMove = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Handle navigation to manga page
  const handleNavigation = (mangaId, e) => {
    if (e) e.stopPropagation();
    if (!isDragging) {
      navigate(`/manga/${mangaId}`);
    }
  };

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerMove", onPointerMove);

    // Auto-play carousel
    const autoplayInterval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000); // Change slide every 5 seconds

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerMove", onPointerMove);
      clearInterval(autoplayInterval);
    };
  }, [emblaApi, onSelect, onPointerDown, onPointerMove]);

  const scrollPrev = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent triggering slide click
      if (emblaApi) emblaApi.scrollPrev();
    },
    [emblaApi]
  );

  const scrollNext = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent triggering slide click
      if (emblaApi) emblaApi.scrollNext();
    },
    [emblaApi]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500">
        {error}
      </div>
    );
  }

  if (!heroData || heroData.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        No featured manga available
      </div>
    );
  }

  return (
    <div className="relative mx-auto px-4 md:px-8 flex flex-column">
      {/* Main Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {heroData.map((slide, index) => (
            <div
              key={index}
              className="relative min-w-full h-72 sm:h-80 md:h-96 lg:h-128 cursor-pointer"
              onClick={() => handleNavigation(slide.mangaId)}
              role="button"
              aria-label={`View details for ${slide.title}`}
            >
              <div className="flex flex-row h-full w-full">
                {/* Image on the left */}
                <div className="w-1/3 md:w-1/4 flex items-center justify-center p-2 md:p-4">
                  <div className="relative w-full h-full flex justify-center items-center">
                    <img
                      src={slide.coverImage}
                      alt={slide.title}
                      className="h-full w-auto max-w-full rounded-lg shadow-lg object-cover z-10"
                    />
                  </div>
                </div>

                {/* Text content on the right */}
                <div
                  className={`w-2/3 md:w-3/4 p-4 md:p-8 flex flex-col justify-center ${
                    slide.textColor || "text-white"
                  }`}
                >
                  <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold mb-2">
                    {slide.title}
                  </h2>
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl mb-2 md:mb-4">
                    {slide.subtitle}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg overflow-y-auto max-h-24 sm:max-h-32 md:max-h-40 lg:max-h-48 mb-4">
                    {slide.description}
                  </p>
                  <div className="mt-2 md:mt-4 flex flex-wrap gap-2">
                    <Link
                      to={`/manga/${slide.mangaId}`}
                      className="bg-white text-black font-bold py-1 px-3 md:py-2 md:px-6 rounded-md hover:bg-gray-200 transition text-sm md:text-base"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Read Now
                    </Link>
                    <button
                      className="border border-white text-white font-bold py-1 px-3 md:py-2 md:px-6 rounded-md hover:bg-white hover:text-black transition text-sm md:text-base"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      Add to Library
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 sm:p-2 hover:bg-opacity-70 z-30 ml-1 sm:ml-2"
        onClick={scrollPrev}
      >
        <ChevronLeft size={16} className="sm:hidden" />
        <ChevronLeft size={24} className="hidden sm:block" />
      </button>
      <button
        className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 sm:p-2 hover:bg-opacity-70 z-30 mr-1 sm:mr-2"
        onClick={scrollNext}
      >
        <ChevronRight size={16} className="sm:hidden" />
        <ChevronRight size={24} className="hidden sm:block" />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2 z-30">
        {heroData.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
              index === selectedIndex ? "bg-white" : "bg-white bg-opacity-50"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              emblaApi?.scrollTo(index);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default MangaHero;
