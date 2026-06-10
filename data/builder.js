/*
====================================================
FILE: builder.js

PURPOSE:
Convert raw text → flashcard format

USAGE:
Paste vocab lists here later
====================================================
*/

export function buildFlashcards(rawText) {
  return rawText
    .split("\n")
    .filter(Boolean)
    .map((line, i) => {
      const [en, ru] = line.split("-");
      return {
        id: "item_" + i,
        english: (en || "").trim(),
        russian: (ru || "").trim()
      };
    });
}
