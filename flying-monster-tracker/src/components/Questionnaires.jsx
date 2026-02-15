import React, { useState } from "react";
import ResourceLibrary, { DetailRow } from "./ResourceLibrary";
import { QUESTIONNAIRE_CATEGORIES, FM_STANDARD_ANSWERS, createQuestionnaire } from "../data/questionnaires";

const s = {
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#6366f1",
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: "1px solid #1e293b",
  },
  questionRow: {
    display: "flex",
    gap: 12,
    marginBottom: 8,
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
  },
  questionLabel: {
    color: "#94a3b8",
    minWidth: 200,
    flexShrink: 0,
  },
  answerValue: (filled) => ({
    color: filled ? "#cbd5e1" : "#475569",
    flex: 1,
    fontStyle: filled ? "normal" : "italic",
  }),
  autoFillBadge: {
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#10b981",
    background: "#052e16",
    padding: "1px 6px",
    borderRadius: 3,
    marginLeft: 6,
    verticalAlign: "middle",
  },
  fillBtn: {
    background: "#10b981",
    border: "none",
    borderRadius: 6,
    padding: "5px 14px",
    color: "#fff",
    fontSize: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 12,
  },
  fillStats: {
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    color: "#64748b",
    marginBottom: 12,
  },
};

function getAutoFillValue(key) {
  if (!key) return null;
  const val = FM_STANDARD_ANSWERS[key];
  if (Array.isArray(val)) return val.join("; ");
  return val || null;
}

function QuestionnaireDetail({ item, onAutoFill }) {
  const totalQuestions = item.sections.reduce((sum, sec) => sum + sec.questions.length, 0);
  const autoFillable = item.sections.reduce(
    (sum, sec) => sum + sec.questions.filter((q) => q.autoFill).length,
    0
  );
  const answered = item.sections.reduce(
    (sum, sec) => sum + sec.questions.filter((q) => q.answer || getAutoFillValue(q.autoFill)).length,
    0
  );

  return (
    <>
      <DetailRow label="Title" value={item.title} />
      <div style={s.fillStats}>
        {answered}/{totalQuestions} answered · {autoFillable} auto-fillable ({Math.round((autoFillable / totalQuestions) * 100)}%)
      </div>
      <button style={s.fillBtn} onClick={(e) => { e.stopPropagation(); onAutoFill(item.id); }}>
        Auto-Fill Standard Answers
      </button>

      {item.sections.map((section, si) => (
        <div key={si} style={s.section}>
          <div style={s.sectionTitle}>{section.title}</div>
          {section.questions.map((q, qi) => {
            const autoVal = getAutoFillValue(q.autoFill);
            const displayVal = q.answer || autoVal;
            return (
              <div key={qi} style={s.questionRow}>
                <span style={s.questionLabel}>
                  {q.q}
                  {q.autoFill && <span style={s.autoFillBadge}>auto</span>}
                </span>
                <span style={s.answerValue(!!displayVal)}>
                  {displayVal || "—"}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      <DetailRow label="Last Used" value={item.lastUsed} />
    </>
  );
}

export default function Questionnaires({ items, onUpdate }) {
  const handleAutoFill = (questId) => {
    onUpdate(
      items.map((item) => {
        if (item.id !== questId) return item;
        return {
          ...item,
          sections: item.sections.map((sec) => ({
            ...sec,
            questions: sec.questions.map((q) => {
              if (!q.autoFill || q.answer) return q;
              const val = getAutoFillValue(q.autoFill);
              return val ? { ...q, answer: val } : q;
            }),
          })),
        };
      })
    );
  };

  return (
    <ResourceLibrary
      title="Questionnaires"
      items={items}
      categories={QUESTIONNAIRE_CATEGORIES}
      categoryField="category"
      titleField="studio"
      subtitleField="title"
      searchFields={[]}
      addLabel="Add Questionnaire"
      onAdd={() => onUpdate([...items, createQuestionnaire()])}
      onEdit={(item) => {
        const studio = prompt("Studio name:", item.studio);
        if (studio !== null) {
          onUpdate(items.map((i) => (i.id === item.id ? { ...i, studio } : i)));
        }
      }}
      onDelete={(id) => {
        if (confirm("Remove this questionnaire?")) {
          onUpdate(items.filter((i) => i.id !== id));
        }
      }}
      renderCardMeta={(item) => {
        const total = item.sections.reduce((s, sec) => s + sec.questions.length, 0);
        const autoFillable = item.sections.reduce(
          (s, sec) => s + sec.questions.filter((q) => q.autoFill).length,
          0
        );
        return (
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            <span>{total} questions</span>
            <span style={{ marginLeft: 8, color: "#10b981" }}>
              {Math.round((autoFillable / total) * 100)}% auto-fill
            </span>
          </div>
        );
      }}
      renderDetail={(item) => (
        <QuestionnaireDetail item={item} onAutoFill={handleAutoFill} />
      )}
    />
  );
}
