import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIExtractButton({ imageUrls = [], onExtracted }) {
  const [loading, setLoading] = useState(false);

  const extract = async () => {
    if (!imageUrls.length) return;
    setLoading(true);

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are analyzing a TSG job sheet image. Extract all visible information and return structured JSON.
      
Look for:
- Job number (usually labelled "Job No", "Job Number", "Work Order", or similar)
- Location name / site name
- Location number or site code
- Date of job
- Start time and finish time
- Any parts listed (part numbers, descriptions, quantities)
- Any technician or engineer names
- Any notes about job status (completed, parts needed, etc.)

Return ONLY valid JSON matching this schema exactly:
{
  "job_number": "string or null",
  "location_name": "string or null",
  "location_number": "string or null",
  "job_date": "YYYY-MM-DD format or null",
  "start_time": "HH:MM format or null",
  "finish_time": "HH:MM format or null",
  "colleague_name": "string or null",
  "completion_notes": "string or null",
  "parts": [
    { "part_number": "string", "description": "string", "quantity": 1, "status": "used" }
  ]
}`,
      file_urls: imageUrls,
      response_json_schema: {
        type: "object",
        properties: {
          job_number: { type: "string" },
          location_name: { type: "string" },
          location_number: { type: "string" },
          job_date: { type: "string" },
          start_time: { type: "string" },
          finish_time: { type: "string" },
          colleague_name: { type: "string" },
          completion_notes: { type: "string" },
          parts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                part_number: { type: "string" },
                description: { type: "string" },
                quantity: { type: "number" },
                status: { type: "string" }
              }
            }
          }
        }
      }
    });

    const cleaned = {};
    Object.entries(result).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') cleaned[k] = v; });
    onExtracted({ ...cleaned, ai_extracted: true });
    setLoading(false);
  };

  return (
    <Button
      type="button"
      onClick={extract}
      disabled={!imageUrls.length || loading}
      className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
      variant="ghost"
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Extracting data...</>
      ) : (
        <><Sparkles className="w-4 h-4" /> Extract from images</>
      )}
    </Button>
  );
}