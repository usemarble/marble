import type { EditorInstance } from "novel";

export function calculateReadabilityScore(editor: EditorInstance): number {
  const text = editor?.getText();
  if (!text || text.trim().length === 0) {
    return 0;
  }

  const wordCountResult = editor.storage.characterCount.words();
  const sentences = text
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0);

  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const syllables = words.reduce((acc, word) => acc + countSyllables(word), 0);

  if (sentences.length === 0 || wordCountResult === 0) {
    return 0;
  }

  const avgSentenceLength = wordCountResult / sentences.length;
  const avgSyllablesPerWord = syllables / wordCountResult;

  const score =
    206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word: string): number {
  const lowerCaseWord = word.toLowerCase();
  if (lowerCaseWord.length <= 3) {
    return 1;
  }

  const lowerCaseWordWithoutEs = lowerCaseWord.replace(
    /(?:[^laeiouy]es|ed|[^laeiouy]e)$/,
    ""
  );
  const lowerCaseWordWithoutY = lowerCaseWordWithoutEs.replace(/^y/, "");

  const syllableMatches = lowerCaseWordWithoutY.match(/[aeiouy]{1,2}/g);
  return syllableMatches ? syllableMatches.length : 1;
}

export function getReadabilityLevel(score: number): {
  level: string;
  description: string;
} {
  if (score >= 90) {
    return {
      level: "Very Easy",
      description: "Easily understood by an average 11-year-old student",
    };
  }
  if (score >= 80) {
    return {
      level: "Easy",
      description: "Conversational English for consumers",
    };
  }
  if (score >= 70) {
    return {
      level: "Fairly Easy",
      description: "Easily understood by 13- to 15-year-old students",
    };
  }
  if (score >= 60) {
    return {
      level: "Standard",
      description: "Easily understood by 15- to 17-year-old students",
    };
  }
  if (score >= 50) {
    return {
      level: "Fairly Difficult",
      description: "Understood by 13- to 15-year-old students",
    };
  }
  if (score >= 30) {
    return {
      level: "Difficult",
      description: "Best understood by university graduates",
    };
  }
  return {
    level: "Very Difficult",
    description: "Best understood by university graduates",
  };
}

export function generateSuggestions(metrics: {
  wordCount: number;
  sentenceCount: number;
  wordsPerSentence: number;
  readabilityScore: number;
}): string[] {
  const { wordCount, sentenceCount, wordsPerSentence, readabilityScore } =
    metrics;
  const suggestions: string[] = [];

  if (wordCount === 0) {
    suggestions.push(
      "Start writing your content to get SEO insights and readability analysis"
    );
    suggestions.push("Aim for at least 300 words for good SEO performance");
    return suggestions;
  }

  if (wordCount <= 50) {
    suggestions.push(
      "Add more content - articles with 300+ words tend to perform better in search results"
    );
    suggestions.push(
      "Consider expanding your ideas with examples, details, or explanations"
    );
    return suggestions;
  }

  if (wordCount <= 150) {
    suggestions.push(
      "Your content is quite short. Consider adding more details for better SEO"
    );
    suggestions.push(
      "Aim for 300-600 words for optimal search engine visibility"
    );
    if (sentenceCount < 3) {
      suggestions.push(
        "Break your content into more sentences for better readability"
      );
    }
    return suggestions;
  }

  if (wordCount <= 300) {
    suggestions.push(
      "Good start! Consider expanding to 300-600 words for better SEO performance"
    );
    if (wordsPerSentence > 25) {
      suggestions.push(
        `Your sentences are quite long (avg: ${wordsPerSentence} words). Try shorter sentences for better readability`
      );
    }
    if (readabilityScore < 50) {
      suggestions.push("Consider using simpler words to improve readability");
    }
    return suggestions;
  }
  if (wordsPerSentence > 25) {
    suggestions.push(
      `Consider shorter sentences (avg: ${wordsPerSentence} words) to improve readability`
    );
  }

  if (readabilityScore < 30) {
    suggestions.push(
      "Your content is quite complex. Consider using simpler vocabulary for broader accessibility"
    );
  } else if (readabilityScore < 50) {
    suggestions.push(
      "Consider simplifying some sentences to improve readability"
    );
  }

  if (sentenceCount < wordCount / 20) {
    suggestions.push(
      "Consider breaking up some longer sentences into shorter ones"
    );
  }

  if (wordCount > 1000 && wordsPerSentence < 15) {
    suggestions.push(
      "Your content is comprehensive! Consider varying sentence length for better flow"
    );
  }

  if (suggestions.length === 0) {
    if (readabilityScore >= 60) {
      suggestions.push(
        "Great! Your content has good readability and length for SEO"
      );
    } else {
      suggestions.push(
        "Your content length is good. Focus on improving readability for better engagement"
      );
    }
  }

  return suggestions;
}
