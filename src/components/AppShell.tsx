import {
  ArrowUp,
  Bold,
  BookOpenCheck,
  BookmarkCheck,
  Home,
  ChevronDown,
  ClipboardX,
  Download,
  LayoutDashboard,
  Menu,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  PencilLine,
  RotateCcw,
  GitCompare,
  Settings,
  X,
} from "lucide-react";
import { useMemo, useState, useEffect, type ReactNode } from "react";
import clsx from "clsx";
import { motion } from "motion/react";
import type { AppPage } from "../app/routes";
import {
  findExamForYear,
  getAvailableYears,
  getExamStage,
  getStageLabel,
  getSubjectLabel,
  getSubjectNumber,
  groupExamsByStage,
} from "../lib/examMetadata";
import type { ExamManifestItem } from "../types/exam";
import { ThemeToggle, type AppTheme } from "./ThemeToggle";

type AppShellProps = {
  children: ReactNode;
  exams: ExamManifestItem[];
  activeExamId: string;
  page: AppPage;
  theme: AppTheme;
  readingBold: boolean;
  answeredCount: number;
  questionCount: number;
  wrongQuestionCount: number;
  favoriteCount: number;
  stickyNoteCount: number;
  isInstallable?: boolean;
  canInstallFromSettings?: boolean;
  onInstall?: () => void;
  onDismissInstallPrompt?: () => void;
  onExamChange: (examId: string) => void;
  onPageChange: (page: AppPage) => void;
  onThemeChange: (theme: AppTheme) => void;
  onReadingBoldChange: (enabled: boolean) => void;
  onReset: () => void;
  onResetAll: () => void;
};

type DropdownOption = {
  label: string;
  value: string;
};

export function AppShell({
  children,
  exams,
  activeExamId,
  page,
  theme,
  readingBold,
  answeredCount,
  questionCount,
  wrongQuestionCount,
  favoriteCount,
  stickyNoteCount,
  isInstallable,
  canInstallFromSettings,
  onInstall,
  onDismissInstallPrompt,
  onExamChange,
  onPageChange,
  onThemeChange,
  onReadingBoldChange,
  onReset,
  onResetAll,
}: AppShellProps) {
  const groupedExams = groupExamsByStage(exams);
  const activeExam = exams.find((exam) => exam.id === activeExamId);
  const activeStage = activeExam ? getExamStage(activeExam) : "stage-1";
  const years = useMemo(() => getAvailableYears(exams), [exams]);
  const activeYear = activeExam?.year ?? years[0] ?? "";
  const activeStageExams = groupedExams[activeStage]
    .filter((exam) => exam.year === activeYear)
    .sort((left, right) => getSubjectNumber(left) - getSubjectNumber(right));
  const progress =
    questionCount === 0 ? 0 : Math.round((answeredCount / questionCount) * 100);

  const yearOptions = years.map((year) => ({ label: year, value: year }));
  const subjectOptions = activeStageExams.map((exam) => ({
    label: getSubjectLabel(exam),
    value: exam.id,
  }));

  const handleStageChange = (stage: "stage-1" | "stage-2") => {
    const firstExam =
      groupedExams[stage].find((exam) => exam.year === activeYear) ??
      groupedExams[stage][0];

    if (firstExam) onExamChange(firstExam.id);
  };

  const handleYearChange = (year: string) => {
    const nextExam = findExamForYear({
      exams,
      year,
      activeExam,
      activeStage,
    });

    if (nextExam) onExamChange(nextExam.id);
  };

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("app-sidebar-collapsed") === "true";
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigationItems = [
    {
      page: "home" as const,
      label: "首頁",
      mobileLabel: "首頁",
      icon: <Home size={18} />,
    },
    {
      page: "exam" as const,
      label: "歷屆試題",
      mobileLabel: "試題",
      icon: <BookOpenCheck size={18} />,
    },
    {
      page: "progress" as const,
      label: "我的進度",
      mobileLabel: "進度",
      icon: <LayoutDashboard size={18} />,
    },
    {
      page: "diseases" as const,
      label: "必看區",
      mobileLabel: "必看",
      icon: <GitCompare size={18} />,
    },
    {
      page: "mistakes" as const,
      label: "錯題本",
      mobileLabel: "錯題",
      icon: <ClipboardX size={18} />,
      badge: wrongQuestionCount,
    },
    {
      page: "favorites" as const,
      label: "收藏區",
      mobileLabel: "收藏",
      icon: <BookmarkCheck size={18} />,
      badge: favoriteCount,
    },
    {
      page: "notes" as const,
      label: "便利貼",
      mobileLabel: "便利貼",
      icon: <NotebookPen size={18} />,
      badge: stickyNoteCount,
    },
  ];

  const handleHomeClick = () => {
    onPageChange("home");
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    window.localStorage.setItem("app-sidebar-collapsed", String(collapsed));
  };

  const handleNavigationChange = (nextPage: AppPage) => {
    onPageChange(nextPage);
    setIsMobileSidebarOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;

          // 1. Always show at the top of the page
          if (currentScrollY < 10) {
            setIsVisible(true);
            setLastScrollY(currentScrollY);
            ticking = false;
            return;
          }

          // 2. Always show at the bottom of the page (within 10px buffer)
          if (currentScrollY >= maxScrollY - 10) {
            setIsVisible(true);
            setLastScrollY(currentScrollY);
            ticking = false;
            return;
          }

          // 3. Threshold to avoid jittery behavior (15px)
          if (Math.abs(currentScrollY - lastScrollY) < 15) {
            ticking = false;
            return;
          }

          // 4. Determine direction
          if (currentScrollY > lastScrollY) {
            // Scrolling down -> hide
            setIsVisible(false);
          } else {
            // Scrolling up -> show
            setIsVisible(true);
          }

          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={clsx(
        "study-journal min-h-screen text-[#4b3b35] transition-colors duration-500",
        theme === "light" && "bg-[#fff8f4]",
        theme === "dark" && "theme-dark bg-[#19161e] text-[#f8edf3]",
        theme === "clinical" && "theme-clinical bg-[#f4f8fb] text-[#26384a]",
        readingBold && "reading-bold",
      )}
    >
      {/* Dynamic Backgrounds */}
      <div
        className={clsx(
          "pointer-events-none fixed inset-0 z-0 bg-[url('/assets/pastel-study-desk.png')] bg-cover bg-top transition-opacity duration-500",
          theme === "light" && "opacity-35",
          theme === "dark" && "opacity-[0.04] saturate-50 brightness-50",
          theme === "clinical" && "opacity-12 saturate-50",
        )}
      />
      <div
        className={clsx(
          "pointer-events-none fixed inset-0 z-0 journal-paper transition-opacity duration-500",
          theme === "dark" ? "opacity-95" : "opacity-70",
        )}
      />

      {/* Desktop Left Fixed Sidebar */}
      <aside
        className={clsx(
          "fixed bottom-0 left-0 top-0 z-40 hidden flex-col overflow-hidden border-r bg-white/70 backdrop-blur-xl transition-[width] duration-300 lg:flex",
          isSidebarCollapsed ? "w-[4.75rem]" : "w-64",
          theme === "dark"
            ? "border-white/12 bg-[#2b2430]/70"
            : theme === "clinical"
            ? "border-[#a3bed0]/45 bg-white/86"
            : "border-[#efd9d0] bg-white/70"
        )}
      >
        {/* Logo and Title */}
        <button
          type="button"
          onClick={handleHomeClick}
          className={clsx(
            "flex w-full items-center gap-3 border-b border-[#f0ded6]/65 text-left transition hover:bg-white/45 focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/45 dark:border-white/10 dark:hover:bg-white/5",
            isSidebarCollapsed ? "justify-center px-3 py-5" : "p-6",
          )}
          aria-label="返回首頁"
          title="返回首頁"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-[#f7cddd] bg-[#ffe7ef] text-[#b65f7c] shadow-[0_6px_18px_rgba(118,91,78,0.08)]">
            <PencilLine size={20} />
          </div>
          <div className={clsx("min-w-0", isSidebarCollapsed && "hidden")}>
            <h1 className="text-lg font-bold tracking-[0.02em] leading-tight text-[#3f342d] dark:text-[#f8edf3]">
              <span className="block whitespace-nowrap">Ariel's Med</span>
              <span className="block whitespace-nowrap">醫師國考</span>
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8b7666] dark:text-[#a2949e]">
              歷屆試題與錯題複習
            </p>
          </div>
        </button>

        <div className={clsx("border-b border-[#f0ded6]/65 dark:border-white/10", isSidebarCollapsed ? "p-3" : "p-4")}>
          <button
            type="button"
            onClick={() => handleSidebarCollapsedChange(!isSidebarCollapsed)}
            className={clsx(
              "flex h-11 items-center rounded-xl border border-[#efd9d0] bg-white/72 text-sm font-semibold text-[#6f5b50] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/45 dark:border-white/10 dark:text-[#dccbd3]",
              isSidebarCollapsed ? "w-full justify-center" : "w-full justify-between px-3",
            )}
            aria-label={isSidebarCollapsed ? "展開側欄" : "收合側欄"}
            title={isSidebarCollapsed ? "展開側欄" : "收合側欄"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!isSidebarCollapsed && <span>收合</span>}
          </button>
        </div>

        {/* Navigation items */}
        <nav className={clsx("min-h-0 flex-1 space-y-1.5 overflow-y-auto", isSidebarCollapsed ? "p-3" : "p-4")}>
          {navigationItems.map((item) => (
            <SidebarLink
              key={item.page}
              active={page === item.page}
              onClick={() => handleNavigationChange(item.page)}
              icon={item.icon}
              badge={item.badge}
              theme={theme}
              collapsed={isSidebarCollapsed}
            >
              {item.label}
            </SidebarLink>
          ))}
        </nav>

        {/* Sidebar bottom settings and theme controls */}
        <div className={clsx("shrink-0 border-t border-[#f0ded6]/65 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/10", isSidebarCollapsed ? "space-y-2 px-3 pt-3" : "space-y-3 px-4 pt-4")}>
          <div className={clsx("space-y-2", isSidebarCollapsed && "hidden")}>
            <span className="text-xs font-semibold text-[#8b7666] dark:text-[#a2949e]">切換主題</span>
            <div className="flex min-w-0 items-center gap-2">
              <ThemeToggle theme={theme} onChange={onThemeChange} compact />
              <ReadingBoldButton
                enabled={readingBold}
                onChange={onReadingBoldChange}
                theme={theme}
              />
            </div>
          </div>
          {isSidebarCollapsed && (
            <ReadingBoldButton
              enabled={readingBold}
              onChange={onReadingBoldChange}
              theme={theme}
            />
          )}
          {isInstallable && onInstall && (
            <div
              className={clsx(
                "flex items-center gap-2",
                isSidebarCollapsed && "flex-col",
              )}
            >
              <button
                type="button"
                onClick={onInstall}
                className={clsx(
                  "flex w-full items-center justify-center gap-2 rounded-xl border border-[#b8e2d4] bg-[#e8f4ee] text-sm font-semibold text-[#355249] transition hover:border-[#a5d9c7] hover:bg-[#d5ebe1] cursor-pointer",
                  isSidebarCollapsed ? "h-11" : "py-2.5",
                )}
                aria-label="加入桌面"
                title="加入桌面"
              >
                <Download size={16} />
                {!isSidebarCollapsed && <span>加入桌面</span>}
              </button>
              {onDismissInstallPrompt && (
                <button
                  type="button"
                  onClick={onDismissInstallPrompt}
                  className={clsx(
                    "shrink-0 rounded-xl border border-[#efd9d0] bg-white/72 text-[#8b7666] transition hover:bg-white hover:text-[#9a496b] focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/45 dark:border-white/10 dark:bg-white/5 dark:text-[#dccbd3]",
                    isSidebarCollapsed ? "h-9 w-9" : "h-10 w-10",
                  )}
                  aria-label="關閉加入桌面提示"
                  title="關閉加入桌面提示"
                >
                  <X size={15} className="mx-auto" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area (shifted right on Desktop) */}
      <div
        className={clsx(
          "flex min-h-screen flex-col transition-[padding] duration-300",
          isSidebarCollapsed ? "lg:pl-[4.75rem]" : "lg:pl-64",
        )}
      >
        {/* Top Header */}
        <header
          className={clsx(
            "sticky top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-5 transition-transform duration-300 ease-in-out",
            !isVisible && "max-lg:-translate-y-full"
          )}
        >
          <div className="mx-auto w-full max-w-[92rem] rounded-[1.25rem] border border-white/80 bg-white/78 px-4 py-3 shadow-[0_12px_40px_rgba(181,133,117,0.12)] backdrop-blur-2xl sm:px-6">
            {/* Desktop Header Layout */}
            <div className="hidden lg:flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => handleSidebarCollapsedChange(!isSidebarCollapsed)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#efd9d0] bg-white/82 text-[#6f5b50] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/45 dark:border-white/10 dark:text-[#dccbd3]"
                  aria-label={isSidebarCollapsed ? "展開側欄" : "收合側欄"}
                  title={isSidebarCollapsed ? "展開側欄" : "收合側欄"}
                >
                  {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </button>
                {page === "home" ? (
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-[0.16em] text-[#b36a84]">
                      PERSONAL DASHBOARD
                    </p>
                    <h2 className="truncate text-lg font-extrabold text-[#3f342d] dark:text-[#f8edf3]">
                      總覽
                    </h2>
                  </div>
                ) : (
                  <FilterControl
                    exams={exams}
                    activeExamId={activeExamId}
                    activeYear={activeYear}
                    activeStage={activeStage}
                    yearOptions={yearOptions}
                    subjectOptions={subjectOptions}
                    onExamChange={onExamChange}
                    handleYearChange={handleYearChange}
                    handleStageChange={handleStageChange}
                    theme={theme}
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <SummaryPill>已作答：{answeredCount} / {questionCount}</SummaryPill>
                <SummaryPill>完成度：{progress}%</SummaryPill>
              </div>
            </div>

            {/* Mobile Header Layout */}
            <div className="flex lg:hidden flex-col gap-2.5">
              {/* Row 1: Title & Theme Switch */}
              <div className="flex flex-wrap items-center justify-between gap-y-2">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#efd9d0] bg-white/82 text-[#6f5b50] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/45 dark:border-white/10 dark:text-[#dccbd3]"
                  aria-label="開啟選單"
                  title="開啟選單"
                >
                  <Menu size={19} />
                </button>
                <button
                  type="button"
                  onClick={handleHomeClick}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-xl pr-2 text-left transition hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/45"
                  aria-label="返回首頁"
                  title="返回首頁"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.8rem] border border-[#f7cddd] bg-[#ffe7ef] text-[#b65f7c]">
                    <PencilLine size={18} />
                  </div>
                  <span className="font-hand text-lg font-bold text-[#3f342d] dark:text-[#f8edf3] truncate">
                    Ariel's Med 醫師國考
                  </span>
                </button>
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <ThemeToggle theme={theme} onChange={onThemeChange} />
                  <ReadingBoldButton
                    enabled={readingBold}
                    onChange={onReadingBoldChange}
                    theme={theme}
                  />
                  {isInstallable && onInstall && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={onInstall}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#b8e2d4] bg-[#e8f4ee] text-[#355249] transition hover:bg-[#d5ebe1] cursor-pointer"
                        aria-label="加入桌面"
                        title="加入桌面"
                      >
                        <Download size={16} />
                      </button>
                      {onDismissInstallPrompt && (
                        <button
                          type="button"
                          onClick={onDismissInstallPrompt}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#efd9d0] bg-white/82 text-[#8b7666] transition hover:bg-white hover:text-[#9a496b] cursor-pointer"
                          aria-label="關閉加入桌面提示"
                          title="關閉加入桌面提示"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Filter Controls & Mobile Progress */}
              <div className="flex items-center justify-between gap-2 border-t border-[#f0ded6]/50 dark:border-white/5 pt-2">
                {page === "home" ? (
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-[0.14em] text-[#b36a84]">
                      PERSONAL DASHBOARD
                    </p>
                    <p className="truncate text-sm font-extrabold text-[#3f342d] dark:text-[#f8edf3]">
                      總覽
                    </p>
                  </div>
                ) : (
                  <FilterControl
                    exams={exams}
                    activeExamId={activeExamId}
                    activeYear={activeYear}
                    activeStage={activeStage}
                    yearOptions={yearOptions}
                    subjectOptions={subjectOptions}
                    onExamChange={onExamChange}
                    handleYearChange={handleYearChange}
                    handleStageChange={handleStageChange}
                    theme={theme}
                  />
                )}
                
                <div className="flex flex-col items-end text-[10px] font-semibold text-[#8b7666] dark:text-[#a2949e]">
                  <span>進度：{progress}%</span>
                  <span>{answeredCount}/{questionCount} 題</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="relative z-10 mx-auto w-full max-w-[92rem] min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Tablet and Mobile Slide-out Navigation */}
      <div className={clsx("fixed inset-0 z-50 lg:hidden", !isMobileSidebarOpen && "pointer-events-none")}>
        <button
          type="button"
          aria-label="關閉選單"
          className={clsx(
            "absolute inset-0 bg-[#3f342d]/28 backdrop-blur-[2px] transition-opacity",
            isMobileSidebarOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
        <aside
          className={clsx(
            "absolute bottom-0 left-0 top-0 flex w-[min(18.5rem,86vw)] flex-col border-r bg-white/92 shadow-[18px_0_44px_rgba(63,52,45,0.16)] backdrop-blur-2xl transition-transform duration-300",
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
            theme === "dark"
              ? "border-white/12 bg-[#2b2430]/94"
              : theme === "clinical"
              ? "border-[#a3bed0]/45 bg-white/94"
              : "border-[#efd9d0] bg-white/92",
          )}
        >
          <div className="flex items-center justify-between border-b border-[#f0ded6]/65 p-5 dark:border-white/10">
            <button
              type="button"
              onClick={handleHomeClick}
              className="flex min-w-0 items-center gap-3 rounded-xl text-left transition hover:opacity-80 focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/45"
              aria-label="返回首頁"
              title="返回首頁"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-[#f7cddd] bg-[#ffe7ef] text-[#b65f7c]">
                <PencilLine size={20} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold leading-tight text-[#3f342d] dark:text-[#f8edf3]">Ariel's Med</h1>
                <p className="text-[11px] font-semibold text-[#8b7666] dark:text-[#a2949e]">醫師國考</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#efd9d0] bg-white/82 text-[#6f5b50] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/45 dark:border-white/10 dark:text-[#dccbd3]"
              aria-label="關閉選單"
              title="關閉選單"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1.5 p-4">
            {navigationItems.map((item) => (
              <SidebarLink
                key={item.page}
                active={page === item.page}
                onClick={() => handleNavigationChange(item.page)}
                icon={item.icon}
                badge={item.badge}
                theme={theme}
              >
                {item.label}
              </SidebarLink>
            ))}
          </nav>

          <div className="space-y-3 border-t border-[#f0ded6]/65 p-4 dark:border-white/10">
            <span className="text-xs font-semibold text-[#8b7666] dark:text-[#a2949e]">切換主題</span>
            <div className="flex min-w-0 items-center gap-2">
              <ThemeToggle theme={theme} onChange={onThemeChange} compact />
              <ReadingBoldButton
                enabled={readingBold}
                onChange={onReadingBoldChange}
                theme={theme}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Floating Bottom Navigation Bar */}
      <nav
        className={clsx(
          "fixed bottom-4 left-1/2 z-40 flex h-16 w-[92%] max-w-[28rem] -translate-x-1/2 items-center justify-around rounded-full border bg-white/78 px-3 shadow-[0_12px_36px_rgba(181,133,117,0.2)] backdrop-blur-2xl lg:hidden transition-transform duration-300 ease-in-out",
          theme === "dark"
            ? "border-white/10 bg-[#2b2430]/78"
            : theme === "clinical"
            ? "border-[#a3bed0]/45 bg-white/86"
            : "border-white/80 bg-white/78",
          !isVisible && "translate-y-[calc(100%+1.5rem)]"
        )}
      >
        {navigationItems.map((item) => (
          <MobileNavLink
            key={item.page}
            active={page === item.page}
            onClick={() => handleNavigationChange(item.page)}
            icon={item.icon}
            label={item.mobileLabel}
            badge={item.badge}
            theme={theme}
          />
        ))}
      </nav>

      <FloatingSettingsButton
        canInstallFromSettings={canInstallFromSettings}
        onInstall={onInstall}
        onReset={onReset}
        onResetAll={onResetAll}
        theme={theme}
        isVisible={isVisible}
      />

      {/* Back to top button */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={clsx(
          "fixed right-5 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#f1aac8] bg-white/90 text-[#9a496b] shadow-[0_12px_34px_rgba(181,133,117,0.2)] backdrop-blur-xl transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-[#fff0f6] focus:outline-none focus:ring-4 focus:ring-[#ffd9e8]/55 sm:right-6 lg:right-6",
          "bottom-24 sm:bottom-6 lg:bottom-6",
          !isVisible && "max-sm:translate-y-18"
        )}
        aria-label="返回頂端"
        title="返回頂端"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}

/* ------------------ Sub Components ------------------ */

function SidebarLink({
  active,
  onClick,
  children,
  icon,
  badge,
  theme,
  collapsed = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  icon: ReactNode;
  badge?: number;
  theme: AppTheme;
  collapsed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full items-center rounded-xl text-sm font-semibold transition cursor-pointer font-hand",
        collapsed ? "relative h-12 justify-center px-2" : "justify-between px-4 py-3",
        active
          ? theme === "dark"
            ? "bg-[#4a2c3a] text-[#f3a6c4]"
            : theme === "clinical"
            ? "bg-[#dbeafe] text-[#1f4e79]"
            : "bg-[#ffddea] text-[#9a496b]"
          : theme === "dark"
          ? "text-[#dccbd3] hover:bg-[#2b2430] hover:text-[#f3a6c4]"
          : theme === "clinical"
          ? "text-[#26384a] hover:bg-[#e8f2f9] hover:text-[#1f4e79]"
          : "text-[#6f5b50] hover:bg-[#fff0f6] hover:text-[#9a496b]"
      )}
      title={typeof children === "string" ? children : undefined}
    >
      <div className={clsx("flex items-center", collapsed ? "justify-center" : "gap-3")}>
        <span className={clsx(
          active
            ? theme === "dark" ? "text-[#f3a6c4]" : theme === "clinical" ? "text-[#1f4e79]" : "text-[#9a496b]"
            : theme === "dark" ? "text-[#a2949e]" : theme === "clinical" ? "text-[#5b6f82]" : "text-[#9a7469]"
        )}>
          {icon}
        </span>
        {!collapsed && <span>{children}</span>}
      </div>
      {typeof badge === "number" && badge > 0 ? (
        <span className={clsx(
          "inline-flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-bold border",
          collapsed && "absolute -right-1 -top-1",
          theme === "dark"
            ? "bg-[#2b2430] border-white/10 text-[#f3a6c4]"
            : theme === "clinical"
            ? "bg-white border-[#c8dbe7] text-[#1f4e79]"
            : "bg-white border-[#efd9d0] text-[#9a496b]"
        )}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function MobileNavLink({
  active,
  onClick,
  icon,
  label,
  badge,
  theme,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  badge?: number;
  theme: AppTheme;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition cursor-pointer font-hand",
        active
          ? theme === "dark" ? "text-[#f3a6c4]" : theme === "clinical" ? "text-[#1f4e79]" : "text-[#9a496b]"
          : theme === "dark" ? "text-[#a2949e] hover:text-[#f3a6c4]" : theme === "clinical" ? "text-[#5b6f82] hover:text-[#1f4e79]" : "text-[#8b7666] hover:text-[#9a496b]"
      )}
    >
      {active && (
        <motion.div
          layoutId="mobile-nav-active"
          className={clsx(
            "absolute inset-0 rounded-xl -z-10",
            theme === "dark" ? "bg-[#4a2c3a]" : theme === "clinical" ? "bg-[#dbeafe]" : "bg-[#ffddea]"
          )}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="shrink-0">{icon}</span>
      <span className="text-[10px] font-bold tracking-[0.02em] mt-0.5">{label}</span>
      {typeof badge === "number" && badge > 0 ? (
        <span className={clsx(
          "absolute -top-1 -right-1 inline-flex min-w-4 h-4 items-center justify-center rounded-full text-[9px] font-extrabold text-white px-1 shadow-sm border",
          theme === "dark" ? "bg-[#b65f7c] border-white/10" : theme === "clinical" ? "bg-[#1f4e79] border-white" : "bg-[#f6a9c6] border-white"
        )}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function ReadingBoldButton({
  enabled,
  onChange,
  theme,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  theme: AppTheme;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={clsx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xs font-extrabold transition shadow-sm",
        enabled
          ? theme === "dark"
            ? "border-white/20 bg-[#4a2c3a] text-[#f3a6c4]"
            : theme === "clinical"
            ? "border-[#1f4e79] bg-[#dbeafe] text-[#1f4e79]"
            : "border-[#f1aac8] bg-[#ffddea] text-[#9a496b]"
          : theme === "dark"
          ? "border-white/10 bg-[#2b2430]/80 text-[#dccbd3] hover:border-white/20"
          : theme === "clinical"
          ? "border-[#c8dbe7] bg-white/80 text-[#26384a] hover:border-[#1f4e79]"
          : "border-[#e6d6c9] bg-white/80 text-[#6f5b50] hover:bg-white",
      )}
      aria-pressed={enabled}
      aria-label={enabled ? "關閉粗體閱讀" : "開啟粗體閱讀"}
      title={enabled ? "關閉粗體閱讀" : "開啟粗體閱讀"}
    >
      <Bold size={16} strokeWidth={2.6} />
    </button>
  );
}

function SummaryPill({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex h-9 items-center rounded-full border border-[#efd9d0] bg-white/82 px-3 text-xs font-semibold text-[#6f5b50] dark:border-white/10 dark:text-[#dccbd3]">
      {children}
    </div>
  );
}

function FilterControl({
  exams,
  activeExamId,
  activeYear,
  activeStage,
  yearOptions,
  subjectOptions,
  onExamChange,
  handleYearChange,
  handleStageChange,
  theme,
}: {
  exams: ExamManifestItem[];
  activeExamId: string;
  activeYear: string;
  activeStage: "stage-1" | "stage-2";
  yearOptions: DropdownOption[];
  subjectOptions: DropdownOption[];
  onExamChange: (id: string) => void;
  handleYearChange: (year: string) => void;
  handleStageChange: (stage: "stage-1" | "stage-2") => void;
  theme: AppTheme;
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  const activeExam = exams.find((exam) => exam.id === activeExamId);
  const stageLabel = activeStage === "stage-1" ? "一階" : "二階";
  const subjectLabel = activeExam ? getSubjectLabel(activeExam) : "選擇科目";

  return (
    <div className="flex items-center gap-1.5 font-hand shrink-0">
      {/* Filter Dropdown Popover */}
      <div
        className="relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFilterOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => setFilterOpen((prev) => !prev)}
          className={clsx(
            "flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold outline-none transition cursor-pointer shadow-sm",
            theme === "dark"
              ? "border-white/10 bg-[#2b2430]/80 text-[#dccbd3] hover:border-white/20 focus:border-white/20 focus:ring-2 focus:ring-white/10"
              : theme === "clinical"
              ? "border-[#c8dbe7] bg-white/86 text-[#26384a] hover:border-[#1f4e79] focus:border-[#1f4e79] focus:ring-2 focus:ring-[#e8f2f9]"
              : "border-[#efd9d0] bg-white/80 text-[#6f5b50] hover:border-[#f1aac8] focus:border-[#f1aac8] focus:ring-2 focus:ring-[#ffd9e8]/55"
          )}
          aria-expanded={filterOpen}
        >
          <span>{activeYear}・{stageLabel}・{subjectLabel}</span>
          <ChevronDown size={12} className={clsx("shrink-0 transition", filterOpen && "rotate-180")} />
        </button>

        {filterOpen && (
          <div
            className={clsx(
              "absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(34rem,calc(100vh-7.5rem))] w-72 space-y-4 overflow-y-auto rounded-[1.2rem] border p-4 shadow-[0_18px_50px_rgba(181,133,117,0.22)] backdrop-blur-xl sm:w-80",
              theme === "dark"
                ? "border-white/15 bg-[#2b2430]/95"
                : theme === "clinical"
                ? "border-[#c8dbe7] bg-white/95"
                : "border-[#e6d6c9] bg-white/95"
            )}
          >
            {/* Year Selector */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b7666] dark:text-[#a2949e]">年度</p>
              <div className="flex flex-wrap gap-1.5">
                {yearOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleYearChange(opt.value)}
                    className={clsx(
                      "min-h-9 rounded-lg px-3 text-xs font-semibold transition cursor-pointer",
                      opt.value === activeYear
                        ? theme === "dark"
                          ? "bg-[#4a2c3a] text-[#f3a6c4]"
                          : theme === "clinical"
                          ? "bg-[#dbeafe] text-[#1f4e79]"
                          : "bg-[#f7e2ea] text-[#8a4561]"
                        : theme === "dark"
                        ? "bg-[#201b25]/60 text-[#dccbd3] border border-white/10 hover:bg-[#2b2430]"
                        : theme === "clinical"
                        ? "bg-white/60 text-[#26384a] border border-[#c8dbe7] hover:bg-[#e8f2f9]"
                        : "bg-white/60 text-[#806b60] border border-[#e6d6c9] hover:bg-[#fff0f6]"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage Selector */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b7666] dark:text-[#a2949e]">階段</p>
              <div className={clsx(
                "inline-flex min-h-10 rounded-lg border p-0.5",
                theme === "dark" ? "border-white/10 bg-[#201b25]/80" : theme === "clinical" ? "border-[#c8dbe7] bg-white/80" : "border-[#e6d6c9] bg-white/80"
              )}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleStageChange("stage-1")}
                  className={clsx(
                    "flex min-h-9 items-center justify-center rounded-[0.35rem] px-3 text-xs font-semibold transition cursor-pointer",
                    activeStage === "stage-1"
                      ? theme === "dark"
                        ? "bg-[#4a2c3a] text-[#f3a6c4]"
                        : theme === "clinical"
                        ? "bg-[#dbeafe] text-[#1f4e79]"
                        : "bg-[#f7e2ea] text-[#8a4561]"
                      : theme === "dark"
                      ? "text-[#dccbd3] hover:bg-white/5"
                      : theme === "clinical"
                      ? "text-[#26384a] hover:bg-white"
                      : "text-[#806b60] hover:bg-white"
                  )}
                >
                  一階
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleStageChange("stage-2")}
                  className={clsx(
                    "flex min-h-9 items-center justify-center rounded-[0.35rem] px-3 text-xs font-semibold transition cursor-pointer",
                    activeStage === "stage-2"
                      ? theme === "dark"
                        ? "bg-[#4a2c3a] text-[#f3a6c4]"
                        : theme === "clinical"
                        ? "bg-[#dbeafe] text-[#1f4e79]"
                        : "bg-[#f7e2ea] text-[#8a4561]"
                      : theme === "dark"
                      ? "text-[#dccbd3] hover:bg-white/5"
                      : theme === "clinical"
                      ? "text-[#26384a] hover:bg-white"
                      : "text-[#806b60] hover:bg-white"
                  )}
                >
                  二階
                </button>
              </div>
            </div>

            {/* Subject Selector */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#8b7666] dark:text-[#a2949e]">科目</p>
              <div className="grid gap-1 pr-1">
                {subjectOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onExamChange(opt.value);
                      setFilterOpen(false);
                    }}
                    className={clsx(
                      "flex min-h-9 items-center rounded-lg px-3 text-left text-xs font-semibold transition cursor-pointer",
                      opt.value === activeExamId
                        ? theme === "dark"
                          ? "bg-[#4a2c3a] text-[#f3a6c4]"
                          : theme === "clinical"
                          ? "bg-[#dbeafe] text-[#1f4e79]"
                          : "bg-[#f7e2ea] text-[#8a4561]"
                        : theme === "dark"
                        ? "text-[#dccbd3] hover:bg-[#2b2430] hover:text-[#f3a6c4]"
                        : theme === "clinical"
                        ? "text-[#26384a] hover:bg-[#e8f2f9] hover:text-[#1f4e79]"
                        : "text-[#806b60] hover:bg-[#fff0f6] hover:text-[#3f342d]"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

function FloatingSettingsButton({
  canInstallFromSettings,
  onInstall,
  onReset,
  onResetAll,
  theme,
  isVisible,
}: {
  canInstallFromSettings?: boolean;
  onInstall?: () => void;
  onReset: () => void;
  onResetAll: () => void;
  theme: AppTheme;
  isVisible: boolean;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      className={clsx(
        "fixed right-20 z-50 bottom-24 sm:bottom-6 lg:bottom-6 transition-all duration-300 ease-in-out",
        !isVisible && "max-sm:translate-y-18",
      )}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setSettingsOpen(false);
      }}
    >
      <button
        type="button"
        onClick={() => setSettingsOpen((prev) => !prev)}
        className={clsx(
          "inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-[0_12px_34px_rgba(181,133,117,0.2)] backdrop-blur-xl transition-all duration-300 ease-in-out hover:-translate-y-0.5 focus:outline-none focus:ring-4",
          settingsOpen
            ? theme === "dark"
              ? "border-white/20 bg-[#4a2c3a] text-[#f3a6c4] focus:ring-white/10"
              : theme === "clinical"
              ? "border-[#1f4e79] bg-[#dbeafe] text-[#1f4e79] focus:ring-[#dbeafe]/70"
              : "border-[#f1aac8] bg-[#ffddea] text-[#9a496b] focus:ring-[#ffd9e8]/55"
            : theme === "dark"
            ? "border-white/14 bg-[#2b2430]/90 text-[#dccbd3] hover:border-white/22 hover:bg-[#352d3b] focus:ring-white/10"
            : theme === "clinical"
            ? "border-[#c8dbe7] bg-white/90 text-[#26384a] hover:border-[#1f4e79] hover:bg-[#f4f8fb] focus:ring-[#dbeafe]/70"
            : "border-[#f1aac8] bg-white/90 text-[#9a496b] hover:bg-[#fff0f6] focus:ring-[#ffd9e8]/55",
        )}
        aria-label="設定"
        title="設定"
        aria-expanded={settingsOpen}
      >
        <Settings size={19} />
      </button>

      {settingsOpen && (
        <div
          className={clsx(
            "absolute bottom-[calc(100%+0.65rem)] right-0 w-56 rounded-xl border p-1 shadow-[0_16px_42px_rgba(181,133,117,0.2)] backdrop-blur-xl",
            theme === "dark"
              ? "border-white/15 bg-[#2b2430]/95"
              : theme === "clinical"
              ? "border-[#c8dbe7] bg-white/95"
              : "border-[#e6d6c9] bg-white/95",
          )}
        >
          {canInstallFromSettings && onInstall && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onInstall();
                setSettingsOpen(false);
              }}
              className={clsx(
                "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold transition cursor-pointer",
                theme === "dark"
                  ? "text-[#dccbd3] hover:bg-white/5 hover:text-[#f3a6c4]"
                  : theme === "clinical"
                  ? "text-[#26384a] hover:bg-[#e8f2f9] hover:text-[#1f4e79]"
                  : "text-[#355249] hover:bg-[#e8f4ee]",
              )}
            >
              <Download size={13} />
              <span>加入桌面</span>
            </button>
          )}
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onReset();
              setSettingsOpen(false);
            }}
            className={clsx(
              "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-semibold transition cursor-pointer",
              canInstallFromSettings && onInstall && "border-t border-[#f0ded6]/40 dark:border-white/10 mt-1 pt-1",
              theme === "dark"
                ? "text-[#ffc4d4] hover:bg-white/5"
                : theme === "clinical"
                ? "text-[#b65f7c] hover:bg-[#fff0f6]"
                : "text-[#8a4561] hover:bg-[#fff0f6]",
            )}
          >
            <RotateCcw size={13} />
            <span>重置本科進度</span>
          </button>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onResetAll();
              setSettingsOpen(false);
            }}
            className={clsx(
              "flex min-h-10 w-full items-center gap-2 rounded-lg border-t border-[#f0ded6]/40 px-3 pt-1 text-left text-xs font-semibold transition cursor-pointer dark:border-white/10 mt-1",
              theme === "dark"
                ? "text-[#ffc4d4] hover:bg-white/5"
                : theme === "clinical"
                ? "text-[#b65f7c] hover:bg-[#fff0f6]"
                : "text-[#8a4561] hover:bg-[#fff0f6]",
            )}
          >
            <RotateCcw size={13} className="rotate-180" />
            <span>重置全部進度</span>
          </button>
        </div>
      )}
    </div>
  );
}
