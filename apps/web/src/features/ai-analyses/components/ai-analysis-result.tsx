import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { ReportJsonRenderer } from "@/features/reports/components/report-json-renderer";
import { AiAnalysis } from "@/features/ai-analyses/types";
import { getAnalysisText } from "@/features/ai-analyses/utils";

export function AiAnalysisResult({ analysis }: { analysis: AiAnalysis }) {
  const text = getAnalysisText(analysis);

  if (text) {
    return (
      <Card className="p-6">
        <div className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:leading-7 prose-li:leading-7">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </Card>
    );
  }

  if (analysis.output_json) {
    return <ReportJsonRenderer content={analysis.output_json} />;
  }

  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">El análisis no tiene resultado disponible.</p>
    </Card>
  );
}
