import { useState, useEffect, useMemo } from "react";
import { GitCompare, Lightbulb, PenLine, Plus, Trash2, CheckCircle2, XCircle, Sparkles, Eye, EyeOff, Bookmark, BookmarkCheck, ChevronDown, ChevronRight, BookOpen, Users, Activity, AlertTriangle } from "lucide-react";
import { loadDiseaseComparisons, loadInstantKillFacts, loadMedicalGlossary, loadEponyms, loadClinicalGuidelines } from "../../lib/loadExamData";
import { DiseaseComparison } from "./DiseaseComparison";
import { BuzzwordFlashcards } from "./BuzzwordFlashcards";
import type { DiseaseComparisonGroup, InstantKillFact, MedicalGlossaryEntry, EponymEntry, ClinicalGuidelineEntry } from "../../types/disease";
import type { StickyNoteItem } from "../../types/stickyNote";
import type { FavoriteEntry, FavoriteTag } from "../favorites/FavoritesPage";

interface DiseaseComparePageProps {
  stickyNotes: StickyNoteItem[];
  onAddNote: (text: string) => void;
  onRemoveNote: (id: string) => void;
  theme: string;
  favorites?: FavoriteEntry[];
  onToggleFavorite?: (examId: string, questionId: string) => void;
  onToggleFavoriteTag?: (examId: string, questionId: string, tag: FavoriteTag) => void;
}

interface QuizQuestion {
  featureKey: string;
  text: string;
  options: string[];
  correctIndex: number;
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

export function DiseaseComparePage({
  stickyNotes,
  onAddNote,
  onRemoveNote,
  theme,
  favorites = [],
  onToggleFavorite,
  onToggleFavoriteTag,
}: DiseaseComparePageProps) {
  const [subTab, setSubTab] = useState<"compare" | "instant_kill" | "glossary" | "eponyms" | "guidelines" | "buzzwords">(() => {
    const saved = localStorage.getItem("disease_compare_sub_tab");
    if (saved && ["compare", "instant_kill", "glossary", "eponyms", "guidelines", "buzzwords"].includes(saved)) {
      return saved as "compare" | "instant_kill" | "glossary" | "eponyms" | "guidelines" | "buzzwords";
    }
    return "compare";
  });

  useEffect(() => {
    localStorage.setItem("disease_compare_sub_tab", subTab);
  }, [subTab]);
  const [groups, setGroups] = useState<DiseaseComparisonGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

  const toggleStageCollapse = (stageName: string) => {
    setCollapsedStages((prev) => ({
      ...prev,
      [stageName]: !prev[stageName],
    }));
  };

  // Instant Kill Facts State
  const [facts, setFacts] = useState<InstantKillFact[]>([]);
  const [factsLoading, setFactsLoading] = useState<boolean>(false);
  const [selectedFactStage, setSelectedFactStage] = useState<"all" | "一階" | "二階">("all");
  const [selectedFactCategory, setSelectedFactCategory] = useState<string>("全部");
  const [factSearch, setFactSearch] = useState<string>("");
  const [factSelfTest, setFactSelfTest] = useState<boolean>(false);
  const [revealedFacts, setRevealedFacts] = useState<Record<string, boolean>>({});

  // Medical Glossary State
  const [glossary, setGlossary] = useState<MedicalGlossaryEntry[]>([]);
  const [glossaryLoading, setGlossaryLoading] = useState<boolean>(false);
  const [selectedGlossaryId, setSelectedGlossaryId] = useState<string>("");
  const [glossarySearch, setGlossarySearch] = useState<string>("");
  const [glossarySelfTest, setGlossarySelfTest] = useState<boolean>(false);
  const [revealedGlossaries, setRevealedGlossaries] = useState<Record<string, boolean>>({});

  // Eponyms State
  const [eponyms, setEponyms] = useState<EponymEntry[]>([]);
  const [eponymsLoading, setEponymsLoading] = useState<boolean>(false);
  const [selectedEponymId, setSelectedEponymId] = useState<string>("");
  const [eponymSearch, setEponymSearch] = useState<string>("");
  const [eponymSelfTest, setEponymSelfTest] = useState<boolean>(false);
  const [revealedEponyms, setRevealedEponyms] = useState<Record<string, boolean>>({});

  // Clinical Guidelines State
  const [guidelines, setGuidelines] = useState<ClinicalGuidelineEntry[]>([]);
  const [guidelinesLoading, setGuidelinesLoading] = useState<boolean>(false);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState<string>("");
  const [guidelineSearch, setGuidelineSearch] = useState<string>("");
  const [guidelineSelfTest, setGuidelineSelfTest] = useState<boolean>(false);
  const [revealedGuidelines, setRevealedGuidelines] = useState<Record<string, boolean>>({});
  const [mustKnowOnly, setMustKnowOnly] = useState<boolean>(false);
  const [mustKnowStage, setMustKnowStage] = useState<"all" | "一階" | "二階">("all");

  // Quiz State
  const [quizList, setQuizList] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Note Input State
  const [noteInput, setNoteInput] = useState<string>("");
  const mustKnowThreshold = 10;

  // Load comparison groups
  useEffect(() => {
    loadDiseaseComparisons()
      .then((data) => {
        setGroups(data.comparison_groups);
        if (data.comparison_groups.length > 0) {
          setSelectedGroupId(data.comparison_groups[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load disease comparisons", err);
        setError("無法載入必看區資料庫，請稍後再試。");
        setLoading(false);
      });
  }, []);

  // Load instant kill facts on demand
  useEffect(() => {
    if (subTab === "instant_kill" && facts.length === 0) {
      setFactsLoading(true);
      loadInstantKillFacts()
        .then((data) => {
          setFacts(data.facts);
          setFactsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load instant-kill facts", err);
          setFactsLoading(false);
        });
    }
  }, [subTab, facts.length]);

  // Load glossary on demand
  useEffect(() => {
    if (subTab === "glossary" && glossary.length === 0) {
      setGlossaryLoading(true);
      loadMedicalGlossary()
        .then((data) => {
          setGlossary(data.terms);
          if (data.terms.length > 0) {
            setSelectedGlossaryId(data.terms[0].id);
          }
          setGlossaryLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load glossary", err);
          setGlossaryLoading(false);
        });
    }
  }, [subTab, glossary.length]);

  // Load eponyms on demand
  useEffect(() => {
    if (subTab === "eponyms" && eponyms.length === 0) {
      setEponymsLoading(true);
      loadEponyms()
        .then((data) => {
          setEponyms(data.eponyms);
          if (data.eponyms.length > 0) {
            setSelectedEponymId(data.eponyms[0].id);
          }
          setEponymsLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load eponyms", err);
          setEponymsLoading(false);
        });
    }
  }, [subTab, eponyms.length]);

  // Load guidelines on demand
  useEffect(() => {
    if (subTab === "guidelines" && guidelines.length === 0) {
      setGuidelinesLoading(true);
      loadClinicalGuidelines()
        .then((data) => {
          setGuidelines(data.guidelines);
          if (data.guidelines.length > 0) {
            setSelectedGuidelineId(data.guidelines[0].id);
          }
          setGuidelinesLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load guidelines", err);
          setGuidelinesLoading(false);
        });
    }
  }, [subTab, guidelines.length]);

  const filteredGlossary = useMemo(() => {
    const searchLower = glossarySearch.trim().toLowerCase();
    return glossary
      .filter((entry) => {
        if (mustKnowStage !== "all" && entry.stage !== mustKnowStage) return false;
        if (mustKnowOnly && entry.frequency < mustKnowThreshold) return false;
        return (
          !searchLower ||
          entry.name.toLowerCase().includes(searchLower) ||
          entry.aliases.some((a) => a.toLowerCase().includes(searchLower)) ||
          entry.category.toLowerCase().includes(searchLower) ||
          entry.explanation.toLowerCase().includes(searchLower) ||
          entry.exam_focus.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => b.frequency - a.frequency || a.name.localeCompare(b.name, "zh-Hant"));
  }, [glossary, glossarySearch, mustKnowOnly, mustKnowStage]);

  const selectedGlossary = useMemo(() => {
    return filteredGlossary.find((entry) => entry.id === selectedGlossaryId) || filteredGlossary[0] || null;
  }, [filteredGlossary, selectedGlossaryId]);

  const stagedGlossaryCategories = useMemo(() => {
    const stages: Record<string, Record<string, MedicalGlossaryEntry[]>> = {
      "第一階段": {},
      "第二階段": {},
    };
    for (const entry of filteredGlossary) {
      const stageName = entry.stage === "一階" ? "第一階段" : "第二階段";
      const cat = entry.category.split(" / ")[0] || "其他分類";
      if (!stages[stageName][cat]) {
        stages[stageName][cat] = [];
      }
      stages[stageName][cat].push(entry);
    }
    return stages;
  }, [filteredGlossary]);

  const filteredEponyms = useMemo(() => {
    const searchLower = eponymSearch.trim().toLowerCase();
    return eponyms
      .filter((entry) => {
        if (mustKnowStage !== "all" && entry.stage !== mustKnowStage) return false;
        if (mustKnowOnly && entry.frequency < mustKnowThreshold) return false;
        return (
          !searchLower ||
          entry.name.toLowerCase().includes(searchLower) ||
          entry.aliases.some((a) => a.toLowerCase().includes(searchLower)) ||
          entry.category.toLowerCase().includes(searchLower) ||
          entry.origin_type.toLowerCase().includes(searchLower) ||
          entry.description.toLowerCase().includes(searchLower) ||
          entry.clinical_signs.toLowerCase().includes(searchLower) ||
          entry.exam_focus.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => b.frequency - a.frequency || a.name.localeCompare(b.name, "zh-Hant"));
  }, [eponyms, eponymSearch, mustKnowOnly, mustKnowStage]);

  const selectedEponym = useMemo(() => {
    return filteredEponyms.find((entry) => entry.id === selectedEponymId) || filteredEponyms[0] || null;
  }, [filteredEponyms, selectedEponymId]);

  const stagedEponymCategories = useMemo(() => {
    const stages: Record<string, Record<string, EponymEntry[]>> = {
      "第一階段": {},
      "第二階段": {},
    };
    for (const entry of filteredEponyms) {
      const stageName = entry.stage === "一階" ? "第一階段" : "第二階段";
      const cat = entry.origin_type || "一般考點";
      if (!stages[stageName][cat]) {
        stages[stageName][cat] = [];
      }
      stages[stageName][cat].push(entry);
    }
    return stages;
  }, [filteredEponyms]);

  const filteredGuidelines = useMemo(() => {
    const searchLower = guidelineSearch.trim().toLowerCase();
    return guidelines
      .filter((entry) => {
        if (mustKnowStage !== "all" && entry.stage !== mustKnowStage) return false;
        if (mustKnowOnly && entry.frequency < mustKnowThreshold) return false;
        return (
          !searchLower ||
          entry.title.toLowerCase().includes(searchLower) ||
          entry.aliases.some((a) => a.toLowerCase().includes(searchLower)) ||
          entry.category.toLowerCase().includes(searchLower) ||
          entry.scenario.toLowerCase().includes(searchLower) ||
          entry.first_line_action.toLowerCase().includes(searchLower) ||
          entry.dosage_info.toLowerCase().includes(searchLower) ||
          entry.common_traps.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => b.frequency - a.frequency || a.title.localeCompare(b.title, "zh-Hant"));
  }, [guidelines, guidelineSearch, mustKnowOnly, mustKnowStage]);

  const selectedGuideline = useMemo(() => {
    return filteredGuidelines.find((entry) => entry.id === selectedGuidelineId) || filteredGuidelines[0] || null;
  }, [filteredGuidelines, selectedGuidelineId]);

  const handlePickRandomGlossary = () => {
    const item = pickRandom(filteredGlossary);
    if (item) setSelectedGlossaryId(item.id);
  };

  const handlePickRandomEponym = () => {
    const item = pickRandom(filteredEponyms);
    if (item) setSelectedEponymId(item.id);
  };

  const handlePickRandomGuideline = () => {
    const item = pickRandom(filteredGuidelines);
    if (item) setSelectedGuidelineId(item.id);
  };

  const stagedGuidelineCategories = useMemo(() => {
    const stages: Record<string, Record<string, ClinicalGuidelineEntry[]>> = {
      "第一階段": {},
      "第二階段": {},
    };
    for (const entry of filteredGuidelines) {
      const stageName = entry.stage === "一階" ? "第一階段" : "第二階段";
      const cat = entry.category.split(" / ")[0] || "臨床指南";
      if (!stages[stageName][cat]) {
        stages[stageName][cat] = [];
      }
      stages[stageName][cat].push(entry);
    }
    return stages;
  }, [filteredGuidelines]);

  const isStage1Fact = (fact: InstantKillFact) => {
    return fact.id.includes("medicine-1") || fact.id.includes("medicine-2");
  };

  const stagedFactCategories = useMemo(() => {
    const stage1Cats = new Set<string>();
    const stage2Cats = new Set<string>();

    for (const f of facts) {
      if (isStage1Fact(f)) {
        if (f.category) stage1Cats.add(f.category);
      } else {
        if (f.category) stage2Cats.add(f.category);
      }
    }

    return {
      "第一階段": Array.from(stage1Cats).sort(),
      "第二階段": Array.from(stage2Cats).sort(),
    };
  }, [facts]);

  const filteredFacts = useMemo(() => {
    return facts
      .filter((f) => {
        const fStage = isStage1Fact(f) ? "一階" : "二階";

        // Stage check
        if (selectedFactStage !== "all" && fStage !== selectedFactStage) {
          return false;
        }

        // Category check
        if (selectedFactCategory !== "全部" && f.category !== selectedFactCategory) {
          return false;
        }

        const searchLower = factSearch.trim().toLowerCase();
        const matchSearch =
          !searchLower ||
          f.subject.toLowerCase().includes(searchLower) ||
          f.category.toLowerCase().includes(searchLower) ||
          f.question_text.toLowerCase().includes(searchLower) ||
          f.explanation.toLowerCase().includes(searchLower) ||
          f.flashcard_front.toLowerCase().includes(searchLower) ||
          f.flashcard_back.toLowerCase().includes(searchLower) ||
          f.reason.toLowerCase().includes(searchLower) ||
          (f.highlight_value && f.highlight_value.toLowerCase().includes(searchLower));

        return matchSearch;
      })
      .sort((a, b) => Number(b.year) - Number(a.year) || a.category.localeCompare(b.category, "zh-Hant"));
  }, [facts, selectedFactStage, selectedFactCategory, factSearch]);

  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // Generate quizzes when selected group changes
  useEffect(() => {
    if (!selectedGroup) return;

    const disA = selectedGroup.diseases[0];
    const disB = selectedGroup.diseases[1];
    const generated: QuizQuestion[] = [];

    const keys = Object.keys(disA.features || {});
    for (const key of keys) {
      const valA = disA.features[key];
      const valB = disB.features[key];

      if (valA && valA !== "—" && valA !== "無" && valA.length > 3) {
        generated.push({
          featureKey: key,
          text: `大腸、腦部或關節等檢查出現臨床特徵【${key}】為：\n「${valA}」\n\n請問這最符合下列哪一種疾病的診斷？`,
          options: [disA.name, disB.name],
          correctIndex: 0,
        });
      }

      if (valB && valB !== "—" && valB !== "無" && valB.length > 3) {
        generated.push({
          featureKey: key,
          text: `大腸、腦部或關節等檢查出現臨床特徵【${key}】為：\n「${valB}」\n\n請問這最符合下列哪一種疾病的診斷？`,
          options: [disA.name, disB.name],
          correctIndex: 1,
        });
      }
    }

    // Shuffle quizzes
    const shuffled = generated.sort(() => Math.random() - 0.5);
    setQuizList(shuffled);
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  }, [selectedGroup]);

  // Get sticky notes linked to the selected comparison group
  const linkedNotes = useMemo(() => {
    if (!selectedGroup) return [];
    const prefix = `[對照:${selectedGroup.title}]`;
    return stickyNotes.filter((note) => note.text.startsWith(prefix));
  }, [stickyNotes, selectedGroup]);

  const handleAddLinkedNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !noteInput.trim()) return;

    const prefix = `[對照:${selectedGroup.title}]`;
    onAddNote(`${prefix} ${noteInput.trim()}`);
    setNoteInput("");
  };

  const handleQuizAnswer = (index: number) => {
    if (selectedAnswer !== null) return; // Already answered
    setSelectedAnswer(index);
    setShowExplanation(true);
  };

  const handleNextQuiz = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentQuizIndex((prev) => (prev + 1) % quizList.length);
  };

  // Grouped menu sidebar items by stage and category
  const stagedCategorizedGroups = useMemo(() => {
    const stages: Record<string, Record<string, DiseaseComparisonGroup[]>> = {
      "第一階段": {},
      "第二階段": {},
    };

    for (const g of groups) {
      const stageName = g.stage === "一階" ? "第一階段" : "第二階段";
      const cat = g.category.split(" / ")[0] || "其他學科";

      if (!stages[stageName][cat]) {
        stages[stageName][cat] = [];
      }
      stages[stageName][cat].push(g);
    }
    return stages;
  }, [groups]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b8527a] border-t-transparent mx-auto"></div>
          <p className="mt-3 text-sm text-[#8a7066] font-hand">正在載入鑑別對照資料庫...</p>
        </div>
      </div>
    );
  }

  if (error || !selectedGroup) {
    return (
      <div className="rounded-[1.2rem] border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <p>{error || "尚未建立必看區資料。"}</p>
      </div>
    );
  }

  const isFactFavorited = (qId: string) => {
    return favorites.some((fav) => fav.question.id === qId);
  };

  const handleToggleFactFavorite = (factId: string) => {
    const parts = factId.split("_");
    if (parts.length < 2) return;
    const examId = `${parts[0]}_${parts[1]}`;
    
    const currentlyFav = isFactFavorited(factId);
    
    if (onToggleFavorite) {
      onToggleFavorite(examId, factId);
    }
    
    if (!currentlyFav && onToggleFavoriteTag) {
      onToggleFavoriteTag(examId, factId, "秒殺數字");
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#efd9d0]/60 pb-3">
        <button
          type="button"
          onClick={() => setSubTab("compare")}
          className={`px-4 py-2 text-sm font-hand font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            subTab === "compare"
              ? "bg-[#b8527a] text-white shadow-xs"
              : "text-[#6f5b50] hover:bg-white/80"
          }`}
        >
          <GitCompare size={15} />
          經典鑑別對照
        </button>
        <button
          type="button"
          onClick={() => setSubTab("instant_kill")}
          className={`px-4 py-2 text-sm font-hand font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            subTab === "instant_kill"
              ? "bg-[#b8527a] text-white shadow-xs"
              : "text-[#6f5b50] hover:bg-white/80"
          }`}
        >
          <Sparkles size={15} />
          國考數字秒殺
        </button>
        <button
          type="button"
          onClick={() => setSubTab("glossary")}
          className={`px-4 py-2 text-sm font-hand font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            subTab === "glossary"
              ? "bg-[#b8527a] text-white shadow-xs"
              : "text-[#6f5b50] hover:bg-white/80"
          }`}
        >
          <BookOpen size={15} />
          臨床名詞百科
        </button>
        <button
          type="button"
          onClick={() => setSubTab("eponyms")}
          className={`px-4 py-2 text-sm font-hand font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            subTab === "eponyms"
              ? "bg-[#b8527a] text-white shadow-xs"
              : "text-[#6f5b50] hover:bg-white/80"
          }`}
        >
          <Users size={15} />
          人名地名考點
        </button>
        <button
          type="button"
          onClick={() => setSubTab("guidelines")}
          className={`px-4 py-2 text-sm font-hand font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            subTab === "guidelines"
              ? "bg-[#b8527a] text-white shadow-xs"
              : "text-[#6f5b50] hover:bg-white/80"
          }`}
        >
          <Activity size={15} />
          二階首選指引
        </button>
        <button
          type="button"
          onClick={() => setSubTab("buzzwords")}
          className={`px-4 py-2 text-sm font-hand font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
            subTab === "buzzwords"
              ? "bg-[#b8527a] text-white shadow-xs"
              : "text-[#6f5b50] hover:bg-white/80"
          }`}
        >
          <Sparkles size={15} />
          關鍵字秒殺
        </button>
      </div>

      {subTab === "compare" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          {/* Sidebar List with Staged Taxonomy */}
          <aside className="w-full min-w-0 max-w-full rounded-[1.4rem] border border-white/90 bg-white/80 p-4 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl lg:sticky lg:top-24 max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2 border-b border-[#efd9d0] pb-3 mb-3">
              <GitCompare size={18} className="text-[#b8527a]" />
              <span className="font-hand font-bold text-base text-[#4b3b35]">必考統整</span>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stagedCategorizedGroups).map(([stageName, categories]) => {
                const hasItems = Object.keys(categories).length > 0;
                if (!hasItems) return null;
                const isCollapsed = collapsedStages[stageName];

                return (
                  <div key={stageName} className="space-y-2">
                    <h3 
                      onClick={() => toggleStageCollapse(stageName)}
                      className="text-xs font-extrabold text-[#b8527a] px-1 border-b border-[#efd9d0] pb-1 flex items-center justify-between cursor-pointer select-none hover:text-[#9a3d60] transition"
                    >
                      <span className="flex items-center gap-1">★ {stageName}</span>
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </h3>
                    {!isCollapsed && (
                      <div className="space-y-3 pl-1.5 mb-4">
                        {Object.entries(categories).map(([category, items]) => (
                          <div key={category}>
                            <h4 className="text-[10px] font-bold tracking-wider text-[#9c7b70] uppercase px-2 mb-1 break-words">
                              {category}
                            </h4>
                            <ul className="space-y-1">
                              {items.map((item) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGroupId(item.id)}
                                    className={`w-full min-w-0 text-left rounded-lg px-2.5 py-2 text-xs font-semibold transition cursor-pointer break-words whitespace-normal ${
                                      item.id === selectedGroupId
                                        ? "bg-[#fdf0f4] text-[#b8527a] font-bold"
                                        : "text-[#6f5b50] hover:bg-white"
                                    }`}
                                  >
                                    {item.title.split(" (")[0]}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main Content View */}
          <div className="min-w-0 space-y-6">
            {/* Intro */}
            <div className="rounded-[1.4rem] border border-white/90 bg-white/82 p-5 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl">
              <h2 className="font-hand text-2xl font-bold text-[#4b3b35] flex items-center gap-2.5">
                <GitCompare size={24} className="text-[#b8527a]" />
                疾病鑑別與對照專區
              </h2>
              <p className="mt-2 text-sm text-[#725b52] leading-6 font-reading">
                本專區精選共 {groups.length} 組國考經典比較對照組，透過雙向比對核心相異處（高亮顯示），並整合歷屆考題與自訂對照筆記（同步至便利貼），幫助您直擊考點、秒殺陷阱。
              </p>
            </div>

            {/* Dynamic Comparison Card */}
            <DiseaseComparison group={selectedGroup} theme={theme} />

            <div className="grid gap-6 md:grid-cols-2">
              {/* Interactive Quiz (Decision Tree alternative) */}
              <section className="rounded-[1.3rem] border border-[#e6d6c9] bg-white/90 p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#efd9d0] pb-3 mb-4">
                  <Lightbulb size={17} className="text-[#d89e1b]" />
                  <h3 className="text-sm font-bold text-[#4b3b35]">臨床決策 PK 診斷測驗</h3>
                </div>

                {quizList.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-xs text-[#a68e98] font-semibold">
                      診斷練習 第 {currentQuizIndex + 1} 題 / 共 {quizList.length} 題
                    </p>
                    <div className="rounded-xl bg-[#fffcf2] border border-[#fceeac]/60 p-4 min-h-24 flex items-center">
                      <p className="text-xs font-semibold leading-6 text-[#725e3c] whitespace-pre-wrap">
                        {quizList[currentQuizIndex]?.text}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      {quizList[currentQuizIndex]?.options.map((opt, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = quizList[currentQuizIndex]?.correctIndex === idx;
                        let btnStyle = "border-[#efd9d0] hover:bg-[#fffbf9] text-[#6f5b50]";

                        if (selectedAnswer !== null) {
                          if (isCorrect) {
                            btnStyle = "border-[#4c806e] bg-[#e9f6f1] text-[#4c806e] font-bold";
                          } else if (isSelected) {
                            btnStyle = "border-[#9a496b] bg-[#fff0f3] text-[#9a496b] font-bold";
                          } else {
                            btnStyle = "opacity-50 border-[#efd9d0] text-[#a68e98]";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleQuizAnswer(idx)}
                            disabled={selectedAnswer !== null}
                            className={`w-full text-left rounded-xl border p-3 text-xs font-semibold transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {selectedAnswer !== null && isCorrect && <CheckCircle2 size={16} className="text-[#4c806e]" />}
                            {selectedAnswer !== null && isSelected && !isCorrect && <XCircle size={16} className="text-[#9a496b]" />}
                          </button>
                        );
                      })}
                    </div>

                    {showExplanation && (
                      <div className="rounded-xl bg-[#effaf5] border border-[#d8eadf] p-4 text-xs">
                        <p className="font-bold text-[#4c806e]">
                          {selectedAnswer === quizList[currentQuizIndex]?.correctIndex ? "🎉 答對了！診斷正確。" : "💡 需要再加強記憶。"}
                        </p>
                        <p className="mt-2 leading-5 text-[#604b43]">
                          考點解析：這項特徵屬於「{quizList[currentQuizIndex]?.options[quizList[currentQuizIndex]?.correctIndex]}」的經典國考特徵，常用於與「{quizList[currentQuizIndex]?.options[1 - quizList[currentQuizIndex]?.correctIndex]}」做鑑別診斷。
                        </p>
                        <button
                          type="button"
                          onClick={handleNextQuiz}
                          className="mt-3 inline-flex min-h-9 items-center justify-center rounded-lg bg-[#4c806e] px-4 text-xs font-bold text-white transition hover:bg-[#3d695a] cursor-pointer"
                        >
                          下一題
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#8a7066] font-hand py-8 text-center">本組對照尚未設定足夠的特徵測驗。</p>
                )}
              </section>

              {/* Linked Sticky Notes */}
              <section className="rounded-[1.3rem] border border-[#e6d6c9] bg-white/90 p-5 shadow-sm">
                <div className="flex items-center gap-2 border-b border-[#efd9d0] pb-3 mb-4">
                  <PenLine size={17} className="text-[#b8527a]" />
                  <h3 className="text-sm font-bold text-[#4b3b35]">自訂對照筆記</h3>
                  <span className="text-[10px] bg-[#fdf0f4] text-[#b8527a] px-2 py-0.5 rounded-full font-bold ml-auto border border-[#f1aac8]/40">
                    連動便利貼
                  </span>
                </div>

                {/* List Linked Notes */}
                <div className="space-y-3 max-h-56 overflow-y-auto mb-4 pr-1">
                  {linkedNotes.length > 0 ? (
                    linkedNotes.map((note) => {
                      const prefix = `[對照:${selectedGroup.title}]`;
                      const displayText = note.text.substring(prefix.length).trim();

                      return (
                        <div
                          key={note.id}
                          className="flex items-start justify-between gap-3 rounded-xl bg-[#fffcf0] border border-[#fceeac] p-3 text-xs shadow-[0_2px_8px_rgba(240,220,130,0.06)]"
                        >
                          <div className="space-y-1">
                            <p className="leading-5 text-[#7a6040] font-hand whitespace-pre-wrap">{displayText}</p>
                            <p className="text-[9px] text-[#b2a18d]">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemoveNote(note.id)}
                            className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[#b2a18d] hover:text-[#9a496b] transition cursor-pointer"
                            title="刪除筆記"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-[#b2a18d] border border-dashed border-[#efd9d0] rounded-xl font-hand">
                      尚未針對本組建立個人筆記。您可以在下方新增！
                    </div>
                  )}
                </div>

                {/* Add Linked Note Form */}
                <form onSubmit={handleAddLinkedNote} className="space-y-2">
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="寫下您對這兩個疾病的學習筆記或口訣（將自動同步至「便利貼」頁面）..."
                    className="w-full rounded-xl border border-[#efd9d0] bg-white p-3 text-xs leading-5 text-[#6f5b50] focus:border-[#c5a6b4] focus:outline-none placeholder-[#b2a18d]"
                    rows={3}
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#b8527a] text-xs font-bold text-white transition hover:bg-[#9c3e5e] cursor-pointer shadow-sm"
                  >
                    <Plus size={14} />
                    儲存筆記
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}

      {subTab === "instant_kill" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          {/* Category Sidebar with Staged Categories */}
          <aside className="w-full min-w-0 max-w-full rounded-[1.4rem] border border-white/90 bg-white/80 p-4 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl lg:sticky lg:top-24 max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2 border-b border-[#efd9d0] pb-3 mb-3">
              <Sparkles size={18} className="text-[#b8527a]" />
              <span className="font-hand font-bold text-base text-[#4b3b35]">學科分類</span>
            </div>
            
            <div className="space-y-4">
              {/* Global Buttons */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFactStage("all");
                  setSelectedFactCategory("全部");
                }}
                className={`w-full min-w-0 text-left rounded-lg px-2.5 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 break-words whitespace-normal ${
                  selectedFactStage === "all"
                    ? "bg-[#fdf0f4] text-[#b8527a]"
                    : "text-[#6f5b50] hover:bg-white"
                }`}
              >
                🌟 顯示全部學科
              </button>

              {/* Stage 1 Section */}
              <div className="space-y-1.5">
                <h3
                  onClick={() => {
                    toggleStageCollapse("fact-stage-1");
                    setSelectedFactStage("一階");
                    setSelectedFactCategory("全部");
                  }}
                  className={`w-full min-h-9 text-left rounded-lg px-2.5 py-2 text-xs font-extrabold text-[#b8527a] border-b border-[#efd9d0]/60 mb-1 transition flex items-center justify-between cursor-pointer select-none hover:text-[#9a3d60] ${
                    selectedFactStage === "一階" && selectedFactCategory === "全部"
                      ? "bg-[#fdf0f4] px-2 py-1 rounded-md"
                      : ""
                  }`}
                >
                  <span className="flex items-center gap-1">★ 第一階段</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full font-bold text-[#866e7b]">全部</span>
                    {collapsedStages["fact-stage-1"] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </span>
                </h3>
                {!collapsedStages["fact-stage-1"] && (
                  <ul className="space-y-0.5 pl-2">
                    {stagedFactCategories["第一階段"].map((cat) => (
                      <li key={cat}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFactStage("一階");
                            setSelectedFactCategory(cat);
                          }}
                          className={`w-full min-h-9 min-w-0 text-left rounded-lg px-2 py-2 text-[11px] font-semibold transition cursor-pointer break-words whitespace-normal ${
                            selectedFactStage === "一階" && selectedFactCategory === cat
                              ? "bg-[#fdf0f4] text-[#b8527a] font-bold"
                              : "text-[#6f5b50] hover:bg-white"
                          }`}
                        >
                          {cat}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Stage 2 Section */}
              <div className="space-y-1.5">
                <h3
                  onClick={() => {
                    toggleStageCollapse("fact-stage-2");
                    setSelectedFactStage("二階");
                    setSelectedFactCategory("全部");
                  }}
                  className={`w-full min-h-9 text-left rounded-lg px-2.5 py-2 text-xs font-extrabold text-[#b8527a] border-b border-[#efd9d0]/60 mb-1 transition flex items-center justify-between cursor-pointer select-none hover:text-[#9a3d60] ${
                    selectedFactStage === "二階" && selectedFactCategory === "全部"
                      ? "bg-[#fdf0f4] px-2 py-1 rounded-md"
                      : ""
                  }`}
                >
                  <span className="flex items-center gap-1">★ 第二階段</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-full font-bold text-[#866e7b]">全部</span>
                    {collapsedStages["fact-stage-2"] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </span>
                </h3>
                {!collapsedStages["fact-stage-2"] && (
                  <ul className="space-y-0.5 pl-2">
                    {stagedFactCategories["第二階段"].map((cat) => (
                      <li key={cat}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFactStage("二階");
                            setSelectedFactCategory(cat);
                          }}
                          className={`w-full min-h-9 min-w-0 text-left rounded-lg px-2.5 py-2 text-[11px] font-semibold transition cursor-pointer break-words whitespace-normal ${
                            selectedFactStage === "二階" && selectedFactCategory === cat
                              ? "bg-[#fdf0f4] text-[#b8527a] font-bold"
                              : "text-[#6f5b50] hover:bg-white"
                          }`}
                        >
                          {cat}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0 space-y-6">
            {/* Header/Controls */}
            <div className="rounded-[1.4rem] border border-white/90 bg-white/82 p-5 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-hand text-2xl font-bold text-[#4b3b35] flex items-center gap-2.5">
                    <Sparkles size={24} className="text-[#d89e1b]" />
                    國考數字秒殺
                  </h2>
                  <p className="mt-1 text-sm text-[#725b52] leading-6 font-reading">
                    精選共 {facts.length} 個高頻數字與分型考點。支持快速搜尋與遮擋自測，點擊下方「延伸演練」直達原始題目。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFactSelfTest(!factSelfTest);
                    setRevealedFacts({});
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer shadow-xs ${
                    factSelfTest
                      ? "bg-[#b8527a] text-white border-[#b8527a] hover:bg-[#9c3e5e]"
                      : "bg-white text-[#6f5b50] border-[#efd9d0] hover:bg-[#fffbf9]"
                  }`}
                >
                  {factSelfTest ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{factSelfTest ? "結束自測" : "遮擋自測模式"}</span>
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={factSearch}
                  onChange={(e) => setFactSearch(e.target.value)}
                  placeholder="搜尋關鍵字（例如：胰島素、cGy、%、Type...）"
                  className="w-full rounded-xl border border-[#efd9d0] bg-white p-3 pl-10 text-xs leading-5 text-[#6f5b50] focus:border-[#c5a6b4] focus:outline-none placeholder-[#b2a18d]"
                />
                <span className="absolute left-3.5 top-3.5 text-[#b2a18d]">🔍</span>
              </div>
            </div>

            {/* Facts Cards Grid */}
            {factsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b8527a] border-t-transparent mx-auto"></div>
                  <p className="mt-3 text-sm text-[#8a7066] font-hand">正在載入秒殺秘笈資料庫...</p>
                </div>
              </div>
            ) : filteredFacts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredFacts.map((fact) => {
                  const isFactRevealed = !factSelfTest || revealedFacts[fact.id];
                  
                  const cardBorderClass = theme === "dark"
                    ? "border-[#5e4757]/80"
                    : theme === "clinical"
                    ? "border-[#c0d6e4]"
                    : "border-[#efd9d0]";

                  const cardBgClass = theme === "dark"
                    ? "bg-[#2d2433]/90 hover:bg-[#342a3b]"
                    : theme === "clinical"
                    ? "bg-[#f1f7fc]/95 hover:bg-[#ebf3f9]"
                    : "bg-[#fffdf5]/90 hover:bg-[#fffae8]";

                  const numTextClass = theme === "dark"
                    ? "text-[#f3a6c4]"
                    : theme === "clinical"
                    ? "text-[#1f4e79]"
                    : "text-[#b8527a]";

                  const labelBgClass = theme === "dark"
                    ? "bg-[#502f40] text-[#f3a6c4]"
                    : theme === "clinical"
                    ? "bg-[#dbeafe] text-[#1f4e79]"
                    : "bg-[#fdf0f4] text-[#b8527a]";

                  const normalTextClass = theme === "dark"
                    ? "text-[#dccbd3]"
                    : "text-[#604b43]";

                  const hasFavorite = isFactFavorited(fact.id);

                  return (
                    <div
                      key={fact.id}
                      onClick={() => {
                        if (factSelfTest) {
                          setRevealedFacts((prev) => ({ ...prev, [fact.id]: !prev[fact.id] }));
                        }
                      }}
                      className={`instant-kill-card group relative rounded-[1.2rem] border p-4 transition duration-300 flex items-start gap-4 shadow-xs select-none cursor-pointer overflow-hidden ${cardBorderClass} ${cardBgClass}`}
                    >
                      {/* Left Side Number Badge */}
                      <div className="instant-kill-number flex flex-col items-center justify-center min-w-16 h-16 rounded-xl bg-white/70 dark:bg-black/30 border border-[#ebdbe2]/40 dark:border-white/5 shadow-2xs">
                        <span className={`text-sm font-extrabold font-hand text-center px-1 leading-tight ${numTextClass}`}>
                          {fact.highlight_value}
                        </span>
                        <span className="text-[9px] font-bold text-[#a68e98] mt-0.5">
                          {fact.unit}
                        </span>
                      </div>

                      {/* Right Side details */}
                      <div className="flex-1 min-w-0 space-y-1.5 transition-all duration-300">
                        <div className="flex flex-wrap items-center gap-1.5 pr-6">
                          <span className="instant-kill-chip inline-block rounded-full bg-[#fcf9fa]/30 border border-[#efd9d0]/60 px-2 py-0.5 text-[9px] font-bold text-[#866e7b] dark:text-[#a68e98]">
                            {fact.category} | {fact.year}
                          </span>
                          {fact.reason && (
                            <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${labelBgClass}`}>
                              {fact.reason}
                            </span>
                          )}
                        </div>

                        <p className={`text-[11px] leading-5 font-reading font-bold ${theme === 'dark' ? 'text-white' : 'text-[#4b3b35]'} ${
                          factSelfTest && !revealedFacts[fact.id]
                            ? "blur-[4px] opacity-20 group-hover:blur-none group-hover:opacity-100"
                            : ""
                        }`}>
                          {fact.flashcard_front}
                        </p>

                        <p className={`text-[11px] leading-5 font-reading ${normalTextClass} ${
                          factSelfTest && !revealedFacts[fact.id]
                            ? "blur-[4px] opacity-20 group-hover:blur-none group-hover:opacity-100"
                            : ""
                        }`}>
                          {fact.flashcard_back}
                        </p>

                        {/* Related practice button */}
                        <div className="pt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-[#a68e98]">
                            {fact.subject}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const parts = fact.id.split("_");
                              if (parts.length >= 2) {
                                const examId = `${parts[0]}_${parts[1]}`;
                                const openQuestionFn = (window as any).__openQuestion;
                                if (typeof openQuestionFn === "function") {
                                  openQuestionFn(examId, fact.id);
                                }
                              }
                            }}
                            className={`inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-bold border transition cursor-pointer bg-white text-[#b8527a] border-[#f1aac8] hover:bg-[#fdf0f4] hover:border-[#b8527a] dark:bg-black/20 dark:text-[#f3a6c4] dark:border-[#5e4757] dark:hover:bg-[#502f40]`}
                          >
                            ⚡ 延伸演練
                          </button>
                        </div>
                      </div>

                      {/* Bookmark Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFactFavorite(fact.id);
                        }}
                        className="absolute top-3.5 right-3.5 inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-white/80 border border-[#efd9d0] text-[#a68e98] hover:text-[#9a496b] hover:bg-[#fff0f6] transition cursor-pointer dark:bg-black/40 dark:border-[#5e4757] dark:text-[#a2949e] dark:hover:text-[#f3a6c4]"
                        title={hasFavorite ? "取消收藏" : "加入收藏"}
                      >
                        {hasFavorite ? (
                          <BookmarkCheck size={14} className="text-[#9a496b] fill-[#9a496b] dark:text-[#f3a6c4] dark:fill-[#f3a6c4]" />
                        ) : (
                          <Bookmark size={14} />
                        )}
                      </button>

                      {/* Mask overlay for Self Test Mode */}
                      {factSelfTest && !revealedFacts[fact.id] && (
                        <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                          <span className="text-[9px] font-bold bg-white/95 dark:bg-black/90 px-2.5 py-1 rounded-full shadow-md text-[#8a7066] dark:text-[#a2949e] flex items-center gap-1 border border-[#efd9d0]/80 dark:border-white/10">
                            <EyeOff size={10} />
                            點擊或懸停解鎖
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-[#efd9d0] bg-white/60 p-12 text-center text-xs text-[#a68e98] font-hand">
                🔍 沒有找到符合關鍵字「{factSearch}」的秒殺考點。
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "glossary" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          {/* Sidebar List with Staged Taxonomy */}
          <aside className="w-full min-w-0 max-w-full rounded-[1.4rem] border border-white/90 bg-white/80 p-4 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl lg:sticky lg:top-24 max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2 border-b border-[#efd9d0] pb-3 mb-3">
              <BookOpen size={18} className="text-[#b8527a]" />
              <span className="font-hand font-bold text-base text-[#4b3b35]">名詞清單</span>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stagedGlossaryCategories).map(([stageName, categories]) => {
                const hasItems = Object.keys(categories).length > 0;
                if (!hasItems) return null;
                const isCollapsed = collapsedStages[`glossary-${stageName}`];

                return (
                  <div key={stageName} className="space-y-2">
                    <h3 
                      onClick={() => toggleStageCollapse(`glossary-${stageName}`)}
                      className="text-xs font-extrabold text-[#b8527a] px-1 border-b border-[#efd9d0] pb-1 flex items-center justify-between cursor-pointer select-none hover:text-[#9a3d60] transition"
                    >
                      <span className="flex items-center gap-1">★ {stageName}</span>
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </h3>
                    {!isCollapsed && (
                      <div className="space-y-3 pl-1.5 mb-4">
                        {Object.entries(categories).map(([category, items]) => (
                          <div key={category}>
                            <h4 className="text-[10px] font-bold tracking-wider text-[#9c7b70] uppercase px-2 mb-1 break-words">
                              {category}
                            </h4>
                            <ul className="space-y-1">
                              {items.map((item) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGlossaryId(item.id)}
                                    className={`w-full min-w-0 text-left rounded-lg px-2.5 py-2 text-xs font-semibold transition cursor-pointer break-words whitespace-normal ${
                                      item.id === selectedGlossaryId
                                        ? "bg-[#fdf0f4] text-[#b8527a] font-bold"
                                        : "text-[#6f5b50] hover:bg-white"
                                    }`}
                                  >
                                    {item.name.split(" (")[0]}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0 space-y-6">
            {/* Intro & Controls */}
            <div className="rounded-[1.4rem] border border-white/90 bg-white/82 p-5 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-hand text-2xl font-bold text-[#4b3b35] flex items-center gap-2.5">
                    <BookOpen size={24} className="text-[#b8527a]" />
                    臨床名詞百科
                  </h2>
                  <p className="mt-1 text-sm text-[#725b52] leading-6 font-reading">
                    本專區精選醫學國考核心名詞。透過簡單直覺的白話觀念與考點分析，幫助您釐清容易混淆的名詞觀念。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGlossarySelfTest(!glossarySelfTest);
                    setRevealedGlossaries({});
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer shadow-xs ${
                    glossarySelfTest
                      ? "bg-[#b8527a] text-white border-[#b8527a] hover:bg-[#9c3e5e]"
                      : "bg-white text-[#6f5b50] border-[#efd9d0] hover:bg-[#fffbf9]"
                  }`}
                >
                  {glossarySelfTest ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{glossarySelfTest ? "結束自測" : "遮擋自測模式"}</span>
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={glossarySearch}
                  onChange={(e) => setGlossarySearch(e.target.value)}
                  placeholder="搜尋名詞關鍵字（例如：奇脈、碎裂紅血球、Pulsus...）"
                  className="w-full rounded-xl border border-[#efd9d0] bg-white p-3 pl-10 text-xs leading-5 text-[#6f5b50] focus:border-[#c5a6b4] focus:outline-none placeholder-[#b2a18d]"
                />
                <span className="absolute left-3.5 top-3.5 text-[#b2a18d]">🔍</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#efd9d0]/70 bg-[#fff8fb]/70 px-3 py-2">
                <span className="text-[11px] font-bold text-[#8a7066]">
                  顯示 {filteredGlossary.length} / {glossary.length} 筆，依出題頻率排序
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "全部"],
                    ["一階", "一階"],
                    ["二階", "二階"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMustKnowStage(value as "all" | "一階" | "二階")}
                      className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                        mustKnowStage === value
                          ? "border-[#b8527a] bg-[#b8527a] text-white"
                          : "border-[#efd9d0] bg-white text-[#6f5b50] hover:bg-[#fffbf9]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMustKnowOnly((prev) => !prev)}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                      mustKnowOnly
                        ? "border-[#b8527a] bg-[#b8527a] text-white"
                        : "border-[#efd9d0] bg-white text-[#6f5b50] hover:bg-[#fffbf9]"
                    }`}
                  >
                    只看高頻 ≥ {mustKnowThreshold}
                  </button>
                  <button
                    type="button"
                    onClick={handlePickRandomGlossary}
                    disabled={filteredGlossary.length === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#f1aac8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#b8527a] transition hover:bg-[#fdf0f4] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Sparkles size={12} />
                    隨機抽一張
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Item Detail */}
            {glossaryLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b8527a] border-t-transparent mx-auto"></div>
                  <p className="mt-3 text-sm text-[#8a7066] font-hand">正在載入名詞百科資料庫...</p>
                </div>
              </div>
            ) : selectedGlossary ? (
              <div 
                onClick={() => {
                  if (glossarySelfTest) {
                    setRevealedGlossaries((prev) => ({ ...prev, [selectedGlossary.id]: !prev[selectedGlossary.id] }));
                  }
                }}
                className={`rounded-[1.4rem] border p-6 space-y-6 transition duration-300 relative overflow-hidden select-none cursor-pointer ${
                  theme === "dark"
                    ? "border-[#5e4757] bg-[#2d2433]/90"
                    : theme === "clinical"
                    ? "border-[#c0d6e4] bg-[#f1f7fc]/95"
                    : "border-[#efd9d0] bg-[#fffdf5]/90"
                }`}
              >
                {/* Title Section */}
                <div className="border-b border-[#efd9d0]/60 pb-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fdf0f4] text-[#b8527a] dark:bg-[#502f40] dark:text-[#f3a6c4] px-3 py-1 text-xs font-bold border border-[#f1aac8]/30">
                      {selectedGlossary.stage}
                    </span>
                    <span className="rounded-full bg-[#fcf9fa]/30 border border-[#efd9d0]/60 px-3 py-1 text-xs font-bold text-[#866e7b] dark:text-[#a68e98]">
                      {selectedGlossary.category}
                    </span>
                    {selectedGlossary.frequency >= 3 && (
                      <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-bold flex items-center gap-1">
                        🔥 出現 {selectedGlossary.frequency} 次
                      </span>
                    )}
                  </div>
                  <h3 className={`text-xl font-bold font-hand ${theme === 'dark' ? 'text-white' : 'text-[#4b3b35]'}`}>
                    {selectedGlossary.name}
                  </h3>
                  {selectedGlossary.aliases && selectedGlossary.aliases.length > 0 && (
                    <p className="text-xs text-[#a68e98]">
                      別名：{selectedGlossary.aliases.join(", ")}
                    </p>
                  )}
                </div>

                {/* Explanation & Exam Focus Content */}
                <div className={`space-y-4 ${
                  glossarySelfTest && !revealedGlossaries[selectedGlossary.id]
                    ? "blur-[5px] opacity-20"
                    : ""
                }`}>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#b8527a] dark:text-[#f3a6c4] flex items-center gap-1.5">
                      💡 白話觀念
                    </h4>
                    <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`}>
                      {selectedGlossary.explanation}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#b8527a] dark:text-[#f3a6c4] flex items-center gap-1.5">
                      🎯 國考重點與常考點
                    </h4>
                    <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`} dangerouslySetInnerHTML={{ __html: selectedGlossary.exam_focus.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}>
                    </p>
                  </div>
                </div>

                {/* Practice Questions */}
                {selectedGlossary.related_questions && selectedGlossary.related_questions.length > 0 && (
                  <div className="border-t border-[#efd9d0]/60 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-[#4b3b35] dark:text-white flex items-center gap-1.5">
                      ⚡ 歷屆延伸演練
                    </h4>
                    <div className="grid gap-3">
                      {selectedGlossary.related_questions.map((q) => (
                        <div 
                          key={q.question_id}
                          className="rounded-xl border border-[#efd9d0]/40 bg-white/50 dark:bg-black/20 p-3.5 space-y-2 flex flex-col justify-between"
                        >
                          <div className="text-[11px] leading-5 text-[#6f5b50] dark:text-[#a68e98]">
                            <span className="font-bold text-[#b8527a] mr-2">[{q.question_id.split('_')[0]}]</span>
                            {q.note}
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const parts = q.question_id.split("_");
                                if (parts.length >= 2) {
                                  const examId = `${parts[0]}_${parts[1]}`;
                                  const openQuestionFn = (window as any).__openQuestion;
                                  if (typeof openQuestionFn === "function") {
                                    openQuestionFn(examId, q.question_id);
                                  }
                                }
                              }}
                              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold border transition cursor-pointer bg-white text-[#b8527a] border-[#f1aac8] hover:bg-[#fdf0f4] hover:border-[#b8527a] dark:bg-black/20 dark:text-[#f3a6c4] dark:border-[#5e4757] dark:hover:bg-[#502f40]"
                            >
                              ⚡ 開始演練題目
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Self Test Mask */}
                {glossarySelfTest && !revealedGlossaries[selectedGlossary.id] && (
                  <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold bg-white/95 dark:bg-black/90 px-4 py-2 rounded-full shadow-lg text-[#8a7066] dark:text-[#a2949e] flex items-center gap-1.5 border border-[#efd9d0]/80 dark:border-white/10">
                      <EyeOff size={14} />
                      點擊卡片解鎖白話與考點
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-[#efd9d0] bg-white/60 p-12 text-center text-xs text-[#a68e98] font-hand">
                🔍 沒有找到符合關鍵字「{glossarySearch}」的名詞百科項目。
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "eponyms" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          {/* Sidebar List with Staged Taxonomy */}
          <aside className="w-full min-w-0 max-w-full rounded-[1.4rem] border border-white/90 bg-white/80 p-4 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl lg:sticky lg:top-24 max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2 border-b border-[#efd9d0] pb-3 mb-3">
              <Users size={18} className="text-[#b8527a]" />
              <span className="font-hand font-bold text-base text-[#4b3b35]">人物誌/病徵</span>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stagedEponymCategories).map(([stageName, categories]) => {
                const hasItems = Object.keys(categories).length > 0;
                if (!hasItems) return null;
                const isCollapsed = collapsedStages[`eponym-${stageName}`];

                return (
                  <div key={stageName} className="space-y-2">
                    <h3 
                      onClick={() => toggleStageCollapse(`eponym-${stageName}`)}
                      className="text-xs font-extrabold text-[#b8527a] px-1 border-b border-[#efd9d0] pb-1 flex items-center justify-between cursor-pointer select-none hover:text-[#9a3d60] transition"
                    >
                      <span className="flex items-center gap-1">★ {stageName}</span>
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </h3>
                    {!isCollapsed && (
                      <div className="space-y-3 pl-1.5 mb-4">
                        {Object.entries(categories).map(([category, items]) => (
                          <div key={category}>
                            <h4 className="text-[10px] font-bold tracking-wider text-[#9c7b70] uppercase px-2 mb-1 break-words">
                              {category}
                            </h4>
                            <ul className="space-y-1">
                              {items.map((item) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEponymId(item.id)}
                                    className={`w-full min-w-0 text-left rounded-lg px-2.5 py-2 text-xs font-semibold transition cursor-pointer break-words whitespace-normal ${
                                      item.id === selectedEponymId
                                        ? "bg-[#fdf0f4] text-[#b8527a] font-bold"
                                        : "text-[#6f5b50] hover:bg-white"
                                    }`}
                                  >
                                    {item.name.split(" (")[0]}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0 space-y-6">
            {/* Intro & Controls */}
            <div className="rounded-[1.4rem] border border-white/90 bg-white/82 p-5 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-hand text-2xl font-bold text-[#4b3b35] flex items-center gap-2.5">
                    <Users size={24} className="text-[#b8527a]" />
                    Eponyms 人名地名考點
                  </h2>
                  <p className="mt-1 text-sm text-[#725b52] leading-6 font-reading">
                    收錄以「人名/地名/經典病徵」命名的疾病或診斷條件。集中整理高頻考點與對照，方便考前衝刺。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEponymSelfTest(!eponymSelfTest);
                    setRevealedEponyms({});
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer shadow-xs ${
                    eponymSelfTest
                      ? "bg-[#b8527a] text-white border-[#b8527a] hover:bg-[#9c3e5e]"
                      : "bg-white text-[#6f5b50] border-[#efd9d0] hover:bg-[#fffbf9]"
                  }`}
                >
                  {eponymSelfTest ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{eponymSelfTest ? "結束自測" : "遮擋自測模式"}</span>
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={eponymSearch}
                  onChange={(e) => setEponymSearch(e.target.value)}
                  placeholder="搜尋人名或疾病關鍵字（例如：川崎、Kussmaul、Aspirin...）"
                  className="w-full rounded-xl border border-[#efd9d0] bg-white p-3 pl-10 text-xs leading-5 text-[#6f5b50] focus:border-[#c5a6b4] focus:outline-none placeholder-[#b2a18d]"
                />
                <span className="absolute left-3.5 top-3.5 text-[#b2a18d]">🔍</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#efd9d0]/70 bg-[#fff8fb]/70 px-3 py-2">
                <span className="text-[11px] font-bold text-[#8a7066]">
                  顯示 {filteredEponyms.length} / {eponyms.length} 筆，依出題頻率排序
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "全部"],
                    ["一階", "一階"],
                    ["二階", "二階"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMustKnowStage(value as "all" | "一階" | "二階")}
                      className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                        mustKnowStage === value
                          ? "border-[#b8527a] bg-[#b8527a] text-white"
                          : "border-[#efd9d0] bg-white text-[#6f5b50] hover:bg-[#fffbf9]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMustKnowOnly((prev) => !prev)}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                      mustKnowOnly
                        ? "border-[#b8527a] bg-[#b8527a] text-white"
                        : "border-[#efd9d0] bg-white text-[#6f5b50] hover:bg-[#fffbf9]"
                    }`}
                  >
                    只看高頻 ≥ {mustKnowThreshold}
                  </button>
                  <button
                    type="button"
                    onClick={handlePickRandomEponym}
                    disabled={filteredEponyms.length === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#f1aac8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#b8527a] transition hover:bg-[#fdf0f4] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Sparkles size={12} />
                    隨機抽一張
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Item Detail */}
            {eponymsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b8527a] border-t-transparent mx-auto"></div>
                  <p className="mt-3 text-sm text-[#8a7066] font-hand">正在載入 Eponyms 名人堂...</p>
                </div>
              </div>
            ) : selectedEponym ? (
              <div 
                onClick={() => {
                  if (eponymSelfTest) {
                    setRevealedEponyms((prev) => ({ ...prev, [selectedEponym.id]: !prev[selectedEponym.id] }));
                  }
                }}
                className={`rounded-[1.4rem] border p-6 space-y-6 transition duration-300 relative overflow-hidden select-none cursor-pointer ${
                  theme === "dark"
                    ? "border-[#5e4757] bg-[#2d2433]/90"
                    : theme === "clinical"
                    ? "border-[#c0d6e4] bg-[#f1f7fc]/95"
                    : "border-[#efd9d0] bg-[#fffdf5]/90"
                }`}
              >
                {/* Title Section */}
                <div className="border-b border-[#efd9d0]/60 pb-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fdf0f4] text-[#b8527a] dark:bg-[#502f40] dark:text-[#f3a6c4] px-3 py-1 text-xs font-bold border border-[#f1aac8]/30">
                      {selectedEponym.stage}
                    </span>
                    <span className="rounded-full bg-[#fcf9fa]/30 border border-[#efd9d0]/60 px-3 py-1 text-xs font-bold text-[#866e7b] dark:text-[#a68e98]">
                      {selectedEponym.origin_type}
                    </span>
                    <span className="rounded-full bg-[#fcf9fa]/30 border border-[#efd9d0]/60 px-3 py-1 text-xs font-bold text-[#866e7b] dark:text-[#a68e98]">
                      {selectedEponym.category}
                    </span>
                    {selectedEponym.frequency >= 3 && (
                      <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-bold flex items-center gap-1">
                        🔥 歷屆出現 {selectedEponym.frequency} 次
                      </span>
                    )}
                  </div>
                  <h3 className={`text-xl font-bold font-hand ${theme === 'dark' ? 'text-white' : 'text-[#4b3b35]'}`}>
                    {selectedEponym.name}
                  </h3>
                  {selectedEponym.aliases && selectedEponym.aliases.length > 0 && (
                    <p className="text-xs text-[#a68e98]">
                      別名：{selectedEponym.aliases.join(", ")}
                    </p>
                  )}
                </div>

                {/* Description, Signs & Focus Content */}
                <div className={`space-y-4 ${
                  eponymSelfTest && !revealedEponyms[selectedEponym.id]
                    ? "blur-[5px] opacity-20"
                    : ""
                }`}>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#b8527a] dark:text-[#f3a6c4] flex items-center gap-1.5">
                      📝 定義與起源
                    </h4>
                    <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`}>
                      {selectedEponym.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#b8527a] dark:text-[#f3a6c4] flex items-center gap-1.5">
                      📋 臨床特徵/診斷指標
                    </h4>
                    <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`}>
                      {selectedEponym.clinical_signs}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#b8527a] dark:text-[#f3a6c4] flex items-center gap-1.5">
                      🎯 國考秒殺重點
                    </h4>
                    <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`} dangerouslySetInnerHTML={{ __html: selectedEponym.exam_focus.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}>
                    </p>
                  </div>
                </div>

                {/* Practice Questions */}
                {selectedEponym.related_questions && selectedEponym.related_questions.length > 0 && (
                  <div className="border-t border-[#efd9d0]/60 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-[#4b3b35] dark:text-white flex items-center gap-1.5">
                      ⚡ 歷屆延伸演練
                    </h4>
                    <div className="grid gap-3">
                      {selectedEponym.related_questions.map((q) => (
                        <div 
                          key={q.question_id}
                          className="rounded-xl border border-[#efd9d0]/40 bg-white/50 dark:bg-black/20 p-3.5 space-y-2 flex flex-col justify-between"
                        >
                          <div className="text-[11px] leading-5 text-[#6f5b50] dark:text-[#a68e98]">
                            <span className="font-bold text-[#b8527a] mr-2">[{q.question_id.split('_')[0]}]</span>
                            {q.note}
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const parts = q.question_id.split("_");
                                if (parts.length >= 2) {
                                  const examId = `${parts[0]}_${parts[1]}`;
                                  const openQuestionFn = (window as any).__openQuestion;
                                  if (typeof openQuestionFn === "function") {
                                    openQuestionFn(examId, q.question_id);
                                  }
                                }
                              }}
                              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold border transition cursor-pointer bg-white text-[#b8527a] border-[#f1aac8] hover:bg-[#fdf0f4] hover:border-[#b8527a] dark:bg-black/20 dark:text-[#f3a6c4] dark:border-[#5e4757] dark:hover:bg-[#502f40]"
                            >
                              ⚡ 開始演練題目
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Self Test Mask */}
                {eponymSelfTest && !revealedEponyms[selectedEponym.id] && (
                  <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold bg-white/95 dark:bg-black/90 px-4 py-2 rounded-full shadow-lg text-[#8a7066] dark:text-[#a2949e] flex items-center gap-1.5 border border-[#efd9d0]/80 dark:border-white/10">
                      <EyeOff size={14} />
                      點擊卡片解鎖起源與秒殺點
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-[#efd9d0] bg-white/60 p-12 text-center text-xs text-[#a68e98] font-hand">
                🔍 沒有找到符合關鍵字「{eponymSearch}」的項目。
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "guidelines" && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
          {/* Sidebar List with Staged Taxonomy */}
          <aside className="w-full min-w-0 max-w-full rounded-[1.4rem] border border-white/90 bg-white/80 p-4 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl lg:sticky lg:top-24 max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <div className="flex items-center gap-2 border-b border-[#efd9d0] pb-3 mb-3">
              <Activity size={18} className="text-[#b8527a]" />
              <span className="font-hand font-bold text-base text-[#4b3b35]">首選指引目錄</span>
            </div>
            
            <div className="space-y-4">
              {Object.entries(stagedGuidelineCategories).map(([stageName, categories]) => {
                const hasItems = Object.keys(categories).length > 0;
                if (!hasItems) return null;
                const isCollapsed = collapsedStages[`guideline-${stageName}`];

                return (
                  <div key={stageName} className="space-y-2">
                    <h3 
                      onClick={() => toggleStageCollapse(`guideline-${stageName}`)}
                      className="text-xs font-extrabold text-[#b8527a] px-1 border-b border-[#efd9d0] pb-1 flex items-center justify-between cursor-pointer select-none hover:text-[#9a3d60] transition"
                    >
                      <span className="flex items-center gap-1">★ {stageName}</span>
                      {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </h3>
                    {!isCollapsed && (
                      <div className="space-y-3 pl-1.5 mb-4">
                        {Object.entries(categories).map(([category, items]) => (
                          <div key={category}>
                            <h4 className="text-[10px] font-bold tracking-wider text-[#9c7b70] uppercase px-2 mb-1 break-words">
                              {category}
                            </h4>
                            <ul className="space-y-1">
                              {items.map((item) => (
                                <li key={item.id}>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGuidelineId(item.id)}
                                    className={`w-full min-w-0 text-left rounded-lg px-2.5 py-2 text-xs font-semibold transition cursor-pointer break-words whitespace-normal ${
                                      item.id === selectedGuidelineId
                                        ? "bg-[#fdf0f4] text-[#b8527a] font-bold"
                                        : "text-[#6f5b50] hover:bg-white"
                                    }`}
                                  >
                                    {item.title.split(" (")[0]}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="min-w-0 space-y-6">
            {/* Intro & Controls */}
            <div className="rounded-[1.4rem] border border-white/90 bg-white/82 p-5 shadow-[0_12px_40px_rgba(181,133,117,0.08)] backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-hand text-2xl font-bold text-[#4b3b35] flex items-center gap-2.5">
                    <Activity size={24} className="text-[#b8527a]" />
                    二階首選指引與毒物處置
                  </h2>
                  <p className="mt-1 text-sm text-[#725b52] leading-6 font-reading">
                    本專區專注整理國考中最常出題的「臨床急重症首選治療、黃金施打時間、解毒劑配對與劑量」以及常見錯誤考題地雷。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGuidelineSelfTest(!guidelineSelfTest);
                    setRevealedGuidelines({});
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold border transition cursor-pointer shadow-xs ${
                    guidelineSelfTest
                      ? "bg-[#b8527a] text-white border-[#b8527a] hover:bg-[#9c3e5e]"
                      : "bg-white text-[#6f5b50] border-[#efd9d0] hover:bg-[#fffbf9]"
                  }`}
                >
                  {guidelineSelfTest ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{guidelineSelfTest ? "結束自測" : "遮擋自測模式"}</span>
                </button>
              </div>

              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={guidelineSearch}
                  onChange={(e) => setGuidelineSearch(e.target.value)}
                  placeholder="搜尋治療、處置或症狀關鍵字（例如：過敏性休克、Epinephrine、有機磷...）"
                  className="w-full rounded-xl border border-[#efd9d0] bg-white p-3 pl-10 text-xs leading-5 text-[#6f5b50] focus:border-[#c5a6b4] focus:outline-none placeholder-[#b2a18d]"
                />
                <span className="absolute left-3.5 top-3.5 text-[#b2a18d]">🔍</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#efd9d0]/70 bg-[#fff8fb]/70 px-3 py-2">
                <span className="text-[11px] font-bold text-[#8a7066]">
                  顯示 {filteredGuidelines.length} / {guidelines.length} 筆，依出題頻率排序
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    ["all", "全部"],
                    ["一階", "一階"],
                    ["二階", "二階"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMustKnowStage(value as "all" | "一階" | "二階")}
                      className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                        mustKnowStage === value
                          ? "border-[#b8527a] bg-[#b8527a] text-white"
                          : "border-[#efd9d0] bg-white text-[#6f5b50] hover:bg-[#fffbf9]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMustKnowOnly((prev) => !prev)}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-bold transition cursor-pointer ${
                      mustKnowOnly
                        ? "border-[#b8527a] bg-[#b8527a] text-white"
                        : "border-[#efd9d0] bg-white text-[#6f5b50] hover:bg-[#fffbf9]"
                    }`}
                  >
                    只看高頻 ≥ {mustKnowThreshold}
                  </button>
                  <button
                    type="button"
                    onClick={handlePickRandomGuideline}
                    disabled={filteredGuidelines.length === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#f1aac8] bg-white px-3 py-1.5 text-[11px] font-bold text-[#b8527a] transition hover:bg-[#fdf0f4] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Sparkles size={12} />
                    隨機抽一張
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Item Detail */}
            {guidelinesLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#b8527a] border-t-transparent mx-auto"></div>
                  <p className="mt-3 text-sm text-[#8a7066] font-hand">正在載入首選指引資料庫...</p>
                </div>
              </div>
            ) : selectedGuideline ? (
              <div 
                onClick={() => {
                  if (guidelineSelfTest) {
                    setRevealedGuidelines((prev) => ({ ...prev, [selectedGuideline.id]: !prev[selectedGuideline.id] }));
                  }
                }}
                className={`rounded-[1.4rem] border p-6 space-y-6 transition duration-300 relative overflow-hidden select-none cursor-pointer ${
                  theme === "dark"
                    ? "border-[#5e4757] bg-[#2d2433]/90"
                    : theme === "clinical"
                    ? "border-[#c0d6e4] bg-[#f1f7fc]/95"
                    : "border-[#efd9d0] bg-[#fffdf5]/90"
                }`}
              >
                {/* Title Section */}
                <div className="border-b border-[#efd9d0]/60 pb-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fdf0f4] text-[#b8527a] dark:bg-[#502f40] dark:text-[#f3a6c4] px-3 py-1 text-xs font-bold border border-[#f1aac8]/30">
                      {selectedGuideline.stage}
                    </span>
                    <span className="rounded-full bg-[#fcf9fa]/30 border border-[#efd9d0]/60 px-3 py-1 text-xs font-bold text-[#866e7b] dark:text-[#a68e98]">
                      {selectedGuideline.category}
                    </span>
                    {selectedGuideline.frequency >= 3 && (
                      <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-bold flex items-center gap-1">
                        🔥 歷屆出現 {selectedGuideline.frequency} 次
                      </span>
                    )}
                  </div>
                  <h3 className={`text-xl font-bold font-hand ${theme === 'dark' ? 'text-white' : 'text-[#4b3b35]'}`}>
                    {selectedGuideline.title}
                  </h3>
                  {selectedGuideline.aliases && selectedGuideline.aliases.length > 0 && (
                    <p className="text-xs text-[#a68e98]">
                      相關對應詞：{selectedGuideline.aliases.join(", ")}
                    </p>
                  )}
                </div>

                {/* Scenario, First line, Dosage & Traps Content */}
                <div className={`space-y-4 ${
                  guidelineSelfTest && !revealedGuidelines[selectedGuideline.id]
                    ? "blur-[5px] opacity-20"
                    : ""
                }`}>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#b8527a] dark:text-[#f3a6c4] flex items-center gap-1.5">
                      🚨 臨床情境線索
                    </h4>
                    <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`}>
                      {selectedGuideline.scenario}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#b8527a] dark:text-[#f3a6c4] flex items-center gap-1.5">
                      🌟 首選/第一線處置
                    </h4>
                    <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`} dangerouslySetInnerHTML={{ __html: selectedGuideline.first_line_action.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}>
                    </p>
                  </div>

                  {selectedGuideline.dosage_info && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-[#b8527a] dark:text-[#f3a6c4] flex items-center gap-1.5">
                        💊 劑量與細節重點
                      </h4>
                      <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`}>
                        {selectedGuideline.dosage_info}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      ⚠️ 考題常規陷阱/地雷
                    </h4>
                    <p className={`text-xs leading-6 font-reading ${theme === 'dark' ? 'text-[#dccbd3]' : 'text-[#604b43]'}`}>
                      {selectedGuideline.common_traps}
                    </p>
                  </div>
                </div>

                {/* Practice Questions */}
                {selectedGuideline.related_questions && selectedGuideline.related_questions.length > 0 && (
                  <div className="border-t border-[#efd9d0]/60 pt-4 space-y-3">
                    <h4 className="text-xs font-bold text-[#4b3b35] dark:text-white flex items-center gap-1.5">
                      ⚡ 歷屆延伸演練
                    </h4>
                    <div className="grid gap-3">
                      {selectedGuideline.related_questions.map((q) => (
                        <div 
                          key={q.question_id}
                          className="rounded-xl border border-[#efd9d0]/40 bg-white/50 dark:bg-black/20 p-3.5 space-y-2 flex flex-col justify-between"
                        >
                          <div className="text-[11px] leading-5 text-[#6f5b50] dark:text-[#a68e98]">
                            <span className="font-bold text-[#b8527a] mr-2">[{q.question_id.split('_')[0]}]</span>
                            {q.note}
                          </div>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const parts = q.question_id.split("_");
                                if (parts.length >= 2) {
                                  const examId = `${parts[0]}_${parts[1]}`;
                                  const openQuestionFn = (window as any).__openQuestion;
                                  if (typeof openQuestionFn === "function") {
                                    openQuestionFn(examId, q.question_id);
                                  }
                                }
                              }}
                              className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold border transition cursor-pointer bg-white text-[#b8527a] border-[#f1aac8] hover:bg-[#fdf0f4] hover:border-[#b8527a] dark:bg-black/20 dark:text-[#f3a6c4] dark:border-[#5e4757] dark:hover:bg-[#502f40]"
                            >
                              ⚡ 開始演練題目
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Self Test Mask */}
                {guidelineSelfTest && !revealedGuidelines[selectedGuideline.id] && (
                  <div className="absolute inset-0 bg-transparent flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold bg-white/95 dark:bg-black/90 px-4 py-2 rounded-full shadow-lg text-[#8a7066] dark:text-[#a2949e] flex items-center gap-1.5 border border-[#efd9d0]/80 dark:border-white/10">
                      <EyeOff size={14} />
                      點擊卡片解鎖處置與劑量資訊
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-[#efd9d0] bg-white/60 p-12 text-center text-xs text-[#a68e98] font-hand">
                🔍 沒有找到符合關鍵字「{guidelineSearch}」的首選處置項目。
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === "buzzwords" && (
        <BuzzwordFlashcards groups={groups} theme={theme} />
      )}
    </div>
  );
}
