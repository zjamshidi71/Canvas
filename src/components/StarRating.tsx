"use client";

import { useState } from "react";

interface StarRatingProps {
  averageRating: number;
  totalRatings: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({
  averageRating,
  totalRatings,
  onRate,
  interactive = false,
  size = "md",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);
  const [animatingStars, setAnimatingStars] = useState(false);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const handleClick = (star: number) => {
    if (!interactive || hasRated) return;
    setHasRated(true);
    setAnimatingStars(true);
    onRate?.(star);
    setTimeout(() => setAnimatingStars(false), 600);
  };

  const displayRating = hoverRating || averageRating;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(displayRating);
          const isHovered = interactive && !hasRated && star <= hoverRating;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || hasRated}
              onClick={() => handleClick(star)}
              onMouseEnter={() =>
                interactive && !hasRated && setHoverRating(star)
              }
              onMouseLeave={() =>
                interactive && !hasRated && setHoverRating(0)
              }
              className={`
                ${sizeClasses[size]}
                transition-all duration-200 ease-out
                ${interactive && !hasRated ? "cursor-pointer hover:scale-110" : "cursor-default"}
                ${animatingStars && filled ? "animate-bounce" : ""}
              `}
              style={{ animationDelay: `${star * 50}ms` }}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill={filled || isHovered ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
                className={`
                  w-full h-full transition-colors duration-200
                  ${filled || isHovered ? "text-amber-400" : "text-gallery-border"}
                `}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                />
              </svg>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-sm">
        {totalRatings > 0 ? (
          <>
            <span className="text-gallery-text font-medium">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gallery-muted">
              ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
            </span>
          </>
        ) : interactive && !hasRated ? (
          <span className="text-gallery-muted">Be the first to rate</span>
        ) : null}
        {hasRated && (
          <span className="text-amber-500 text-sm font-medium animate-fade-in">
            Thank you!
          </span>
        )}
      </div>
    </div>
  );
}
