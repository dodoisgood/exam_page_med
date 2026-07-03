import clsx from "clsx";
import { Check, X } from "lucide-react";
import type { AnswerOptionKey, ExamQuestion } from "../../types/exam";
import { acceptedAnswers, getOptionTone } from "../../lib/text";

type AnswerOptionsProps = {
  question: ExamQuestion;
  selected?: AnswerOptionKey;
  onAnswer: (answer: AnswerOptionKey) => void;
};

const optionKeys: AnswerOptionKey[] = ["A", "B", "C", "D"];

export function AnswerOptions({
  question,
  selected,
  onAnswer,
}: AnswerOptionsProps) {
  return (
    <div className="mt-5 grid gap-3 sm:mt-6">
      {optionKeys.map((option) => {
        const tone = getOptionTone(selected, acceptedAnswers(question), option);

        return (
          <button
            key={option}
            type="button"
            onClick={() => onAnswer(option)}
            className={clsx(
              "group flex min-h-[4.75rem] w-full min-w-0 touch-manipulation items-start gap-3 whitespace-normal rounded-[1.05rem] border px-4 py-4 text-left shadow-sm transition sm:min-h-16 sm:gap-4",
              tone === "correct" &&
                "border-[#8fd5bd] bg-[#e7f8f0] text-[#315447] shadow-[0_12px_28px_rgba(132,197,174,0.2)] dark:border-[#4f9f84] dark:bg-[#17372e] dark:text-[#d7f7ec] dark:shadow-[0_12px_28px_rgba(27,79,64,0.28)]",
              tone === "wrong" &&
                "border-[#efa6b9] bg-[#fff0f3] text-[#7b4652] dark:border-[#b65f7c] dark:bg-[#472431] dark:text-[#ffdbe6]",
              tone === "muted" &&
                "border-[#ead8cf] bg-[#fffaf7] text-[#a58d82] dark:border-white/12 dark:bg-[#241e2a] dark:text-[#b8a7b1]",
              tone === "idle" &&
                "border-[#ead8cf] bg-white/80 text-[#604b43] hover:-translate-y-0.5 hover:border-[#f0adc9] hover:bg-[#fff3f8] dark:border-white/14 dark:bg-[#241e2a]/92 dark:text-[#f4e8ef] dark:hover:border-[#b65f7c] dark:hover:bg-[#302635]",
            )}
          >
            <span
              className={clsx(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold sm:h-8 sm:w-8",
                tone === "correct" && "bg-[#9edcc5] text-[#315447] dark:bg-[#65c7a5] dark:text-[#102821]",
                tone === "wrong" && "bg-[#efa6b9] text-white dark:bg-[#d87a99] dark:text-[#2b1720]",
                tone === "muted" && "bg-[#f3e7e0] text-[#aa9186] dark:bg-[#352c3b] dark:text-[#a997a3]",
                tone === "idle" &&
                  "bg-[#f8eae3] text-[#8b6d62] group-hover:bg-[#ffddea] group-hover:text-[#9a496b] dark:bg-[#f3e8ed] dark:text-[#593945] dark:group-hover:bg-[#f3a6c4] dark:group-hover:text-[#2b1720]",
              )}
            >
              {tone === "correct" ? (
                <Check size={16} />
              ) : tone === "wrong" ? (
                <X size={16} />
              ) : (
                option
              )}
            </span>
            <span className="min-w-0 flex-1 whitespace-normal break-words text-[1rem] leading-7 sm:text-base">
              {question.options[option]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
