import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImageUploader({ imageUrls = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const uploaded = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      uploaded.push(file_url);
    }
    onChange([...imageUrls, ...uploaded]);
    setUploading(false);
  };

  const remove = (url) => onChange(imageUrls.filter(u => u !== url));

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm font-medium">Drop images or click to upload</p>
            <p className="text-xs text-muted-foreground">Multiple images supported</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {imageUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {imageUrls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => remove(url)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}