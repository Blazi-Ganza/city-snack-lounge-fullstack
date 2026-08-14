import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBranch } from "../context/BranchContext";
import { getBranchName } from "../data";
import { Button } from "../components/ui/Button";
import { PageHero } from "../components/ui/PageHero";

type Review = {
  id: string;
  name: string;
  rating: number;
  review: string;
  date: string;
  branch: string;
};

// Mock reviews - replace with API data later
const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    name: "Sarah Uwimana",
    rating: 5,
    review:
      "Absolutely loved the atmosphere and the food was incredible! The staff went above and beyond to make our anniversary dinner special. Highly recommend the grilled tilapia.",
    date: "2025-07-28",
    branch: "musanze",
  },
  {
    id: "2",
    name: "Jean Paul K.",
    rating: 4,
    review:
      "Great spot for a quick lunch. Service was fast and the coffee is some of the best in town. Will definitely be back!",
    date: "2025-07-20",
    branch: "musanze",
  },
  {
    id: "3",
    name: "Aline M.",
    rating: 5,
    review:
      "The ambiance is beautiful and perfect for both business meetings and casual hangouts. The menu variety is impressive.",
    date: "2025-07-15",
    branch: "kigali",
  },
  {
    id: "4",
    name: "David N.",
    rating: 5,
    review:
      "One of my favorite places! The staff remembers my order and always makes me feel welcome. Excellent service every time.",
    date: "2025-07-10",
    branch: "musanze",
  },
];

/* ─── Helpers ─────────────────────────────────────────── */

function StarDisplay({ rating, size = "text-base" }: { rating: number; size?: string }) {
  return (
    <div
      className={`flex gap-0.5 ${size}`}
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= rating ? "text-[var(--primary)]" : "text-[var(--line)]"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ─── Main Page ───────────────────────────────────────── */

export function ReviewsPage() {
  const { selectedBranch } = useBranch();
  const branchLabel = getBranchName(selectedBranch);

  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Filter reviews by branch
  const branchReviews = reviews.filter((r) => r.branch === selectedBranch);

  const averageRating =
    branchReviews.length > 0
      ? branchReviews.reduce((sum, r) => sum + r.rating, 0) /
        branchReviews.length
      : 0;

  // Rating distribution for the summary
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: branchReviews.filter((r) => r.rating === star).length,
    percentage:
      branchReviews.length > 0
        ? (branchReviews.filter((r) => r.rating === star).length /
            branchReviews.length) *
          100
        : 0,
  }));

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim() || !review.trim()) return;

    const newReview: Review = {
      id: Date.now().toString(),
      name: name.trim(),
      rating,
      review: review.trim(),
      date: new Date().toISOString().split("T")[0],
      branch: selectedBranch,
    };

    setReviews((prev) => [newReview, ...prev]);

    console.log("New review submitted:", newReview);

    setSubmitted(true);
    setName("");
    setReview("");
    setRating(5);

    setTimeout(() => {
      setShowForm(false);
      setSubmitted(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-[var(--bg-soft)]">
      {/* ═══════════════════════════════════════════════
          HERO — no watermark for clean look
      ═══════════════════════════════════════════════ */}
      <PageHero
        eyebrow="Guest Experiences"
        title="Moments at"
        accentWord={branchLabel}
        accentPosition="after"
        subtitle="Real stories from real guests — every review helps us serve you better."
        showWatermark={false}
      />

      {/* ═══════════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════════ */}
      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* ─── Rating Summary Card ─── */}
        {branchReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-8 shadow-sm sm:p-10"
          >
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              {/* Left: Big rating number */}
              <div className="flex flex-col items-center border-b border-[var(--line)] pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-8">
                <div className="font-display text-6xl font-semibold text-[var(--ink)] sm:text-7xl">
                  {averageRating.toFixed(1)}
                </div>
                <div className="mt-3 text-2xl">
                  <StarDisplay
                    rating={Math.round(averageRating)}
                    size="text-3xl"
                  />
                </div>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  Based on {branchReviews.length}{" "}
                  {branchReviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>

              {/* Right: Rating distribution bars */}
              <div className="space-y-2">
                {ratingCounts.map(({ star, count, percentage }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-medium text-[var(--muted)]">
                      {star} ★
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-soft)]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full bg-[var(--primary)]"
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-[var(--muted)]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 flex justify-center border-t border-[var(--line)] pt-6">
              <Button
                onClick={() => setShowForm((v) => !v)}
                className="w-full sm:w-auto"
              >
                {showForm ? "Cancel" : "Write a Review"}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ─── Review Form (Toggleable) ─── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 overflow-hidden"
            >
              <div className="rounded-3xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm sm:p-10">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
                      Your voice matters
                    </p>
                    <h2 className="font-display mt-2 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
                      Share your experience
                    </h2>
                  </div>
                </div>

                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/10 px-4 py-3 text-sm font-medium text-[var(--success)]"
                  >
                    <span className="text-lg">✓</span>
                    Thank you! Your review has been submitted.
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-semibold text-[var(--ink)]"
                    >
                      Your name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      required
                      className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 py-3 text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    />
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-[var(--ink)]">
                      Your rating
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= (hoveredRating || rating);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            className="text-4xl transition-transform hover:scale-110"
                            aria-label={`${star} star rating`}
                          >
                            <span
                              className={
                                active
                                  ? "text-[var(--primary)]"
                                  : "text-[var(--line)]"
                              }
                            >
                              ★
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="review"
                      className="mb-2 block text-sm font-semibold text-[var(--ink)]"
                    >
                      Your review
                    </label>
                    <textarea
                      id="review"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="Tell us what you enjoyed about your visit..."
                      required
                      rows={5}
                      maxLength={1000}
                      className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 py-3 text-[var(--ink)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
                    />
                    <p className="mt-2 text-right text-xs text-[var(--muted)]">
                      {review.length}/1000
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1">
                      Submit Review
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-xl border border-[var(--line)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--card-hover)]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Reviews List ─── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
                Latest feedback
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold text-[var(--ink)] sm:text-3xl">
                Recent Reviews
              </h2>
            </div>

            {branchReviews.length === 0 && !showForm && (
              <Button onClick={() => setShowForm(true)}>
                Write First Review
              </Button>
            )}
          </div>

          {branchReviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--line)] bg-[var(--card)] p-12 text-center">
              <div className="text-5xl">💬</div>
              <p className="mt-4 font-semibold text-[var(--ink)]">
                No reviews yet
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Be the first to share your experience at {branchLabel}!
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {branchReviews.map((r, i) => (
                <motion.article
                  key={r.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * i }}
                  whileHover={{ y: -4 }}
                  className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-sm transition-all hover:border-[var(--primary)]/20 hover:shadow-lg"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
                        {getInitials(r.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          {r.name}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {formatDate(r.date)}
                        </p>
                      </div>
                    </div>
                    <StarDisplay rating={r.rating} size="text-lg" />
                  </header>

                  <div className="font-display mt-4 text-3xl leading-none text-[var(--primary)]/30">
                    &ldquo;
                  </div>

                  <p className="mt-1 flex-1 text-sm leading-relaxed text-[var(--ink)]">
                    {r.review}
                  </p>
                </motion.article>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </main>
  );
}