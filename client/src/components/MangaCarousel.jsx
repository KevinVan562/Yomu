import React, { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";

const MangaCarousel = ({ featuredManga }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: true,
    containScroll: "trimSnaps",
    speed: 10,
    align: "start",
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full max-w-screen-2xl mx-auto px-2">
      {/* Next/Prev Buttons */}
      <div className="absolute top-1/2 transform -translate-y-[4rem] left-[-2rem] z-30">
        <button
          className="bg-[#363636] text-white p-2 rounded-full disabled:opacity-30"
          onClick={scrollPrev}
          disabled={!prevBtnEnabled}
        >
          ←
        </button>
      </div>
      <div className="absolute top-1/2 transform -translate-y-[4rem] right-[-2rem] z-30">
        <button
          className="bg-[#363636] text-white p-2 rounded-full disabled:opacity-30"
          onClick={scrollNext}
          disabled={!nextBtnEnabled}
        >
          →
        </button>
      </div>

      {/* Embla Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {featuredManga.map((manga) => (
            <div
              key={manga.id}
              className="flex-[0_0_33.3%] sm:flex-[0_0_40%] md:flex-[0_0_22%] lg:flex-[0_0_16%] xl:flex-[0_0_18%] px-1.5"
            >
              <div className="bg-transparent rounded-sm overflow-hidden transition duration-300 relative">
                <div className="relative w-[220px] aspect-[2/3] group shadow hover:shadow-lg">
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

                  {/* Hover overlay */}
                  <Link
                    to={`/manga/${manga.id}`}
                    className="absolute left-0 top-0 w-full h-full flex flex-col justify-between items-center rounded-sm bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto"
                    draggable="false"
                  >
                    <div
                      className="flex-1 overflow-auto px-4 py-2 text-white text-sm pointer-events-auto"
                      style={{
                        maxHeight: "270px",
                        WebkitOverflowScrolling: "touch",
                      }}
                      draggable="false"
                    >
                      {manga.description}
                    </div>

                    <div className="pb-4 mb-2 pointer-events-auto">
                      <button className="px-4 py-2 bg-purple-500 text-white text-sm font-semibold rounded hover:bg-purple-700 transition duration-300">
                        Read Me
                      </button>
                    </div>
                  </Link>
                </div>

                {/* Manga Title */}
                <div className="p-4 text-center bg-transparent">
                  <p className="text-sm font-semibold text-white line-clamp-2">
                    {manga.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MangaCarousel;
