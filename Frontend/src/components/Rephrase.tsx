import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  originalText: string;
  biasedSentences: string[]; // sentences flagged as biased
  onRephrase: () => Promise<string>; // function hitting Gemini API
};

export default function RephraseView({ originalText, biasedSentences, onRephrase }: Props) {
  const [rephrased, setRephrased] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRephrase = async () => {
    setLoading(true);
    const newText = await onRephrase();
    setRephrased(newText);
    setLoading(false);
  };

  // Highlight biased sentences
  const highlightedOriginal = originalText.split(/(?<=\.)/).map((sentence, idx) => {
    const trimmed = sentence.trim();
    const isBiased = biasedSentences.includes(trimmed);
    return (
      <span
        key={idx}
        className={isBiased ? "bg-red-200 text-red-800 px-1 rounded" : ""}
      >
        {sentence + " "}
      </span>
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {!rephrased ? (
        <Button onClick={handleRephrase} disabled={loading}>
          {loading ? "Rephrasing..." : "Rephrase"}
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Original (Biased)</h2>
              <p className="text-base leading-relaxed">{highlightedOriginal}</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Rephrased (Neutral)</h2>
              <p className="text-base leading-relaxed whitespace-pre-line">{rephrased}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
