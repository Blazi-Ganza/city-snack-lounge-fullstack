import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useBranch } from "../context/BranchContext";
import { useLanguage } from "../context/LanguageContext";
import { getBranchName, type FoodItem } from "../data";
import { FoodCard } from "../components/FoodCard";
import { Button } from "../components/ui/Button";
import { LogoWatermark } from "../components/ui/LogoWatermark";
import { getApi } from "../services/api";
import { cn } from "../utils/cn";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=2000&q=80";

const GALLERY = [
  { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80", alt: "Plated dinner" },
  { src: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1200&q=80", alt: "Chef plating" },
  { src: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80", alt: "Grilled dish" },
  { src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80", alt: "Cocktails" },
  { src: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80", alt: "Fine dining" },
  { src: "https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=1200&q=80", alt: "Restaurant interior" },
];

/* ─── Event Interface ─── */
interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  image: string;
  category: "music" | "dining" | "special" | "workshop";
  spotsLeft?: number;
  price?: number;
  isFeatured?: boolean;
}

/* ─── shared class for ghost buttons on dark/image backgrounds ─── */
const darkGhost =
  "!border !border-white/60 !text-white !bg-white/10 backdrop-blur-sm " +
  "hover:!border-white hover:!bg-white/20 hover:!text-white";

export function HomePage() {
  const { selectedBranch, basePath } = useBranch();
  const { t } = useLanguage();
  const branchLabel = getBranchName(selectedBranch);
  const [featured, setFeatured] = useState<FoodItem[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);

  // ─── Data driven from translations (rebuilds when language changes) ───
  const SERVICES = [
    { icon: "🍽️", title: t("home.services.dineIn.title"),        desc: t("home.services.dineIn.desc") },
    { icon: "🛵", title: t("home.services.delivery.title"),      desc: t("home.services.delivery.desc") },
    { icon: "🥡", title: t("home.services.pickup.title"),        desc: t("home.services.pickup.desc") },
    { icon: "📅", title: t("home.services.reservations.title"),  desc: t("home.services.reservations.desc") },
  ];

  const TRUST_STATS = [
    { value: "5,000+", label: t("home.stats.guests") },
    { value: "80+",    label: t("home.stats.menuItems") },
    { value: "4.9★",   label: t("home.stats.rating") },
    { value: "20 min", label: t("home.stats.prepTime") },
  ];

  const TESTIMONIALS = [
    { quote: t("home.testimonials.review1.quote"), author: "Aline U.",      role: t("home.testimonials.review1.role"), rating: 5 },
    { quote: t("home.testimonials.review2.quote"), author: "Jean-Paul K.",  role: t("home.testimonials.review2.role"), rating: 5 },
    { quote: t("home.testimonials.review3.quote"), author: "Grace M.",      role: t("home.testimonials.review3.role"), rating: 4 },
  ];

  // Fetch menu items
  useEffect(() => {
    getApi<{ menu: Array<Omit<FoodItem, "id"> & { id?: number }> }>(
      `/api/customer/${selectedBranch}/menu`,
    )
      .then((data) => {
        const mapped = data.menu.map((item, index) => ({
          ...item,
          id: item.id ?? index + 1,
        }));
        setFeatured(mapped.filter((item) => item.featured).slice(0, 4));
      })
      .catch(() => setFeatured([]));
  }, [selectedBranch]);

  // Fetch featured event (uses new dedicated endpoint)
  useEffect(() => {
    getApi<{ event: Event | null }>(
      `/api/customer/${selectedBranch}/events/featured`
    )
      .then((data) => {
        setFeaturedEvent(data?.event || null);
      })
      .catch(() => setFeaturedEvent(null));
  }, [selectedBranch]);

  return (
    <div className="bg-[var(--bg-soft)]">
      {/* ═══════════════════════════════════════════════ HERO ═══════════════════════════════════════════════ */}
      <HeroSection
        branchLabel={branchLabel}
        basePath={basePath}
        t={t}
      />

      {/* ═══════════════════════════════════════════════ TRUST BAR ═══════════════════════════════════════════════ */}
      <section className="border-b border-[var(--line)] bg-[var(--card)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          {TRUST_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display text-3xl font-semibold text-[var(--ink)] sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ WELCOME CARD ═══════════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-16 sm:px-6">
        <motion.div
          className="overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--card)] shadow-sm shadow-slate-900/5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid md:grid-cols-2">
            <div className="overflow-hidden">
              <motion.img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1800&q=80"
                alt="Warm restaurant interior"
                className="h-64 w-full object-cover md:h-full"
                whileHover={{ scale: 1.07 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                loading="lazy"
              />
            </div>

            <div className="p-6 sm:p-10">
              <motion.img
                src="/images/city-snack-logo.png"
                alt="City Snack Lounge"
                className="h-16 w-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                loading="lazy"
              />
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                {branchLabel}
              </p>
              <h2 className="font-display mt-3 max-w-2xl text-3xl font-semibold leading-tight text-[var(--ink)] sm:text-4xl">
                {t("home.title", { branch: branchLabel })}
              </h2>
              <p className="font-ui mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                {t("home.subtitle")}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={`${basePath}/menu`}>
                  <Button>{t("home.browseMenu")}</Button>
                </Link>
                <Link to={`${basePath}/chat`}>
                  <Button variant="ghost">{t("home.chat")}</Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════ SERVICES ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <LogoWatermark
            variant="corner"
            position="bottom-right"
            opacity={0.04}
            size="md"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mb-10 text-center"
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
              {t("home.services.eyebrow")}
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
              {t("home.services.title")}
            </h2>
          </motion.div>

          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((service, i) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 text-3xl">{service.icon}</div>
                <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ FEATURED EVENT BANNER ═══════════════════════════════════════════════ */}
      {featuredEvent && (
        <section className="relative w-full py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative mx-auto w-full max-w-7xl"
          >
            <Link to={`${basePath}/reservation`} className="group block">
              <div className="relative h-[420px] w-full overflow-hidden sm:h-[480px] sm:rounded-3xl md:h-[520px]">

                {/* Background Image with Parallax Zoom */}
                <motion.img
                  src={featuredEvent.image}
                  alt={featuredEvent.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  initial={{ scale: 1.1 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  loading="lazy"
                />

                {/* Cinematic Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Animated accent glow */}
                <motion.div
                  className="absolute -right-32 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[var(--primary)]/20 blur-3xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />

                {/* Content Layer */}
                <div className="relative flex h-full flex-col justify-between p-6 sm:p-10 md:p-14">

                  {/* Top row: badges */}
                  <div className="flex items-center gap-3">
                    <motion.span
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-2xl"
                    >
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                      Upcoming Event
                    </motion.span>

                    {featuredEvent.spotsLeft != null && featuredEvent.spotsLeft <= 10 && (
                      <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="rounded-full bg-red-500/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur"
                      >
                        Only {featuredEvent.spotsLeft} spots left
                      </motion.span>
                    )}
                  </div>

                  {/* Bottom row: main content */}
                  <div className="max-w-2xl">
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 }}
                      className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#D4A017]"
                    >
                      {featuredEvent.category} · {branchLabel}
                    </motion.p>

                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 }}
                      className="font-display text-3xl font-semibold leading-[1.1] text-white sm:text-5xl md:text-6xl"
                    >
                      {featuredEvent.title}
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.7 }}
                      className="mt-4 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base"
                    >
                      {featuredEvent.description}
                    </motion.p>

                    {/* Info strip */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 }}
                      className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/90"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg"></span>
                        <span className="font-medium">
                          {new Date(featuredEvent.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-white/30" />
                      <div className="flex items-center gap-2">
                        <span className="text-lg"></span>
                        <span className="font-medium">{featuredEvent.time}</span>
                      </div>
                      <div className="h-4 w-px bg-white/30" />
                      <div className="flex items-center gap-2">
                        <span className="text-lg"></span>
                        <span className="font-semibold">
                          {featuredEvent.price
                            ? `${featuredEvent.price.toLocaleString()} RWF`
                            : "Free Entry"}
                        </span>
                      </div>
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.9 }}
                      className="mt-8 flex flex-wrap items-center gap-4"
                    >
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-2xl transition-all group-hover:gap-3 group-hover:bg-[var(--primary)] group-hover:text-white">
                        Reserve Your Spot
                        <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 group-hover:text-white">
                        Learn More
                      </span>
                    </motion.div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════ GALLERY ═══════════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
            {t("home.gallery.eyebrow")}
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            {t("home.gallery.title")}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {GALLERY.map((photo, i) => (
            <motion.div
              key={photo.src}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className={cn(
                "overflow-hidden rounded-2xl",
                i % 3 === 1 && "sm:translate-y-8",
              )}
            >
              <motion.img
                src={photo.src}
                alt={photo.alt}
                className="aspect-square w-full object-cover sm:aspect-[4/5]"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.7 }}
                loading="lazy"
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ TESTIMONIALS ═══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[var(--bg-soft)] to-[var(--paper)] py-20">
        <LogoWatermark
          variant="double"
          position="right"
          opacity={0.06}
          size="xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
          >
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--primary)]">
                {t("home.testimonials.eyebrow")}
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
                {t("home.testimonials.title")}
              </h2>
              <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
                {t("home.testimonials.subtitle")}
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Link to={`${basePath}/reviews`}>
                <Button>{t("home.testimonials.writeReview")}</Button>
              </Link>
              <Link
                to={`${basePath}/reviews`}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)] hover:underline"
              >
                {t("home.testimonials.seeAll")}
              </Link>
            </div>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((review, i) => (
              <motion.article
                key={review.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)]/80 p-6 shadow-sm backdrop-blur-sm transition-all hover:border-[var(--primary)]/20 hover:shadow-lg"
              >
                <div
                  className="mb-4 flex gap-0.5 text-lg"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={s <= review.rating ? "text-[var(--primary)]" : "text-[var(--line)]"}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <div className="font-display mb-2 text-5xl leading-none text-[var(--primary)]/30">
                  &ldquo;
                </div>

                <p className="flex-1 text-sm leading-relaxed text-[var(--ink)]">
                  {review.quote}
                </p>

                <footer className="mt-6 flex items-center gap-3 border-t border-[var(--line)] pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)]/10 text-sm font-semibold text-[var(--primary)]">
                    {review.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {review.author}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{review.role}</p>
                  </div>
                </footer>
              </motion.article>
            ))}
          </div>

          <div className="mt-8 flex justify-center sm:hidden">
            <Link to={`${basePath}/reviews`} className="w-full">
              <Button className="w-full">
                {t("home.testimonials.shareExperience")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ FINAL CTA ═══════════════════════════════════════════════ */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-neutral-900 px-8 py-16 text-center text-white sm:px-12"
        >
          <motion.div
            className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--primary)]/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[#D4A017]/20 blur-3xl"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />

          <div className="relative">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D4A017]">
              {t("home.cta.eyebrow")}
            </p>
            <h2 className="font-display text-3xl font-semibold sm:text-5xl">
              {t("home.cta.title", { branch: branchLabel })}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
              {t("home.cta.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to={`${basePath}/reservation`}>
                <Button>{t("home.reserveTable")}</Button>
              </Link>
              <Link to={`${basePath}/menu`}>
                <Button variant="ghost" className={darkGhost}>
                  {t("home.cta.viewMenu")}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════════════════════ */
type HeroSectionProps = {
  branchLabel: string;
  basePath: string;
  t: (k: string, v?: Record<string, string>) => string;
};

function HeroSection({ branchLabel, basePath, t }: HeroSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-[85vh] w-full overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="City Snack Lounge dining"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative flex h-full items-end px-4 pb-16 sm:px-8 sm:pb-20"
      >
        <div className="mx-auto w-full max-w-6xl text-white">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#D4A017]"
          >
            {branchLabel} · City Snack Lounge
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="font-display max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl lg:text-7xl"
          >
            {t("home.title", { branch: branchLabel })}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-5 max-w-xl text-base text-white/80 sm:text-lg"
          >
            {t("home.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to={`${basePath}/menu`}>
              <Button>{t("home.browseMenu")}</Button>
            </Link>
            <Link to={`${basePath}/reservation`}>
              <Button variant="ghost" className={darkGhost}>
                {t("home.reserveTable")}
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em]">
            {t("home.hero.scroll")}
          </span>
          <div className="h-8 w-px bg-white/40" />
        </div>
      </motion.div>
    </section>
  );
}