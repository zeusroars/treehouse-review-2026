"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { LogOut, Menu, Search, User, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import type { GalleryEntryWithVotes } from "@/types/gallery";
import {
  JUMP_HIGHLIGHT_CSS,
  useGalleryJump,
} from "@/lib/gallery/use-gallery-jump";

interface SiteHeaderProps {
  variant?: "gallery" | "judge";
  jumpEntries?: GalleryEntryWithVotes[];
  onExpandAll?: () => void;
}

function HeaderInlineSearch({
  entries,
  onExpandAll,
}: {
  entries: GalleryEntryWithVotes[];
  onExpandAll?: () => void;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const { query, setQuery, errorMsg, jump, canJump } = useGalleryJump(
    {
      entries,
      onExpandAll,
      onSuccess: () => {
        setQuery("");
        inputRef.current?.blur();
      },
    },
    {
      notFound: (q) => t("gallery.jumpNotFound", { query: q }),
      notVisible: (id) => t("gallery.jumpNotVisible", { entryId: id }),
    }
  );

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    jump();
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      jump();
    }
    if (e.key === "Escape") {
      setQuery("");
      inputRef.current?.blur();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="relative hidden lg:flex"
    >
      <div
        className={`flex items-center gap-1.5 rounded-full bg-white/70 p-1 ring-1 transition-all ${
          errorMsg
            ? "ring-red-300"
            : "ring-slate-200/70 focus-within:ring-sage-400/70"
        }`}
      >
        <span className="flex items-center gap-1.5 rounded-full px-2 py-1.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-sage-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t("gallery.jumpPlaceholder")}
            className="w-36 bg-transparent text-xs leading-none text-slate-700 placeholder:text-slate-400 focus:w-52 focus:outline-none transition-[width] duration-200"
            autoComplete="off"
            spellCheck={false}
          />
        </span>
        {canJump && (
          <button
            type="submit"
            className="shrink-0 rounded-full bg-sage-600 px-3 py-1.5 text-xs font-medium leading-none text-white transition hover:bg-sage-700"
          >
            {t("gallery.jumpGo")}
          </button>
        )}
      </div>
      {errorMsg && (
        <p className="absolute left-0 top-full mt-1.5 w-64 rounded-lg bg-white px-3 py-2 text-[11px] text-red-500 shadow-lg ring-1 ring-slate-100">
          {errorMsg}
        </p>
      )}
    </form>
  );
}

function UserAvatar({
  image,
  name,
  size = "md",
}: {
  image?: string | null;
  name?: string | null;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = useState(false);
  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  if (image && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name || "avatar"}
        onError={() => setFailed(true)}
        className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={`inline-flex ${dim} items-center justify-center rounded-full bg-sage-100 text-sage-700 ring-2 ring-white shadow-sm`}
      aria-hidden
    >
      <User className="h-4 w-4" />
    </span>
  );
}

function UserMenuDesktop() {
  const { t } = useLanguage();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status !== "authenticated" || !session?.user) return null;

  const name = session.user.name?.trim() || t("common.signedInUser");

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("common.accountMenu")}
      >
        <UserAvatar image={session.user.image} name={name} />
      </button>

      <div
        className={`absolute right-0 top-full z-[60] mt-2 w-52 origin-top-right overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-slate-200/80 transition duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
        role="menu"
      >
        <div className="border-b border-slate-100 px-3 py-2.5">
          <p className="truncate text-xs font-medium text-slate-800">{name}</p>
          <p className="truncate text-[10px] text-slate-400">
            {t("common.signedInWithLine")}
          </p>
        </div>
        <button
          type="button"
          role="menuitem"
          onClick={() => void signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("common.signOut")}
        </button>
      </div>
    </div>
  );
}

function NavPillLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-sage-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}

export default function SiteHeader({
  variant = "gallery",
  jumpEntries,
  onExpandAll,
}: SiteHeaderProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  const onGallery = pathname === "/";
  const onJudge = pathname.startsWith("/judge");
  const showSearch = onGallery && !!jumpEntries?.length;
  const isLoggedIn = status === "authenticated" && Boolean(session?.user);
  const displayName =
    session?.user?.name?.trim() || t("common.signedInUser");

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  return (
    <>
      {/* Dim gallery when mobile menu is open (below sticky header) */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] transition-opacity duration-300 md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!menuOpen}
        onClick={closeMenu}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-wood-50/90 backdrop-blur-md">
      {showSearch && <style>{JUMP_HIGHLIGHT_CSS}</style>}

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-4 md:py-4 lg:px-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.2em] text-sage-500">
            {t("preview.brandTagline")}
          </p>
          <h1 className="truncate text-base font-light tracking-wide text-slate-800 sm:text-lg lg:text-xl">
            {variant === "judge" ? t("judge.pageTitle") : t("gallery.title")}
          </h1>
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {showSearch && (
            <HeaderInlineSearch
              entries={jumpEntries!}
              onExpandAll={onExpandAll}
            />
          )}

          <nav className="flex items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-slate-200/70">
            <NavPillLink href="/" active={onGallery}>
              {t("gallery.navGallery")}
            </NavPillLink>
            <NavPillLink href="/judge" active={onJudge}>
              {t("gallery.navJudge")}
            </NavPillLink>
          </nav>

          <LanguageSwitcher />
          <UserMenuDesktop />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-700 ring-1 ring-slate-200/80 transition hover:bg-white md:hidden"
          aria-label={menuOpen ? t("common.closeMenu") : t("common.openMenu")}
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav-panel"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="site-mobile-nav-panel"
        className={`grid transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 border-t border-slate-200/50 px-4 py-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-3 ring-1 ring-slate-200/70">
                <UserAvatar
                  image={session?.user?.image}
                  name={displayName}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t("common.signedInWithLine")}
                  </p>
                </div>
              </div>
            ) : null}

            <nav className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={closeMenu}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
                  onGallery
                    ? "bg-sage-600 text-white"
                    : "bg-white/70 text-slate-700 ring-1 ring-slate-200/70"
                }`}
              >
                {t("gallery.navGallery")}
              </Link>
              <Link
                href="/judge"
                onClick={closeMenu}
                className={`rounded-xl px-3 py-3 text-sm font-medium transition ${
                  onJudge
                    ? "bg-sage-600 text-white"
                    : "bg-white/70 text-slate-700 ring-1 ring-slate-200/70"
                }`}
              >
                {t("gallery.navJudge")}
              </Link>
            </nav>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 ring-1 ring-slate-200/70">
              <span className="text-xs font-medium text-slate-500">
                {t("language.label")}
              </span>
              <LanguageSwitcher />
            </div>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  void signOut({ callbackUrl: "/" });
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-sm font-medium text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                {t("common.signOut")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      </header>
    </>
  );
}
