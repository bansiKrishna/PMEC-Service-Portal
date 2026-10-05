import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/button';

interface FileUploadProps {
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  description?: string;
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  error?: string | null;
  success?: boolean;
  onReset?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = '.html,.htm,image/*',
  maxSizeMb = 10,
  label = 'Upload file',
  description = 'HTML template or image file (max 10MB)',
  onFileSelect,
  isUploading = false,
  error = null,
  success = false,
  onReset,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setLocalError(null);

    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setLocalError(`File size exceeds limit of ${maxSizeMb}MB.`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setLocalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onReset) onReset();
  };

  const activeError = error || localError;

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${
          selectedFile ? 'cursor-default' : 'cursor-pointer'
        } ${
          dragOver
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
            : activeError
            ? 'border-rose-400 bg-rose-50/30 dark:bg-rose-950/20'
            : success
            ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
        />

        {!selectedFile ? (
          <div className="text-center space-y-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full inline-block">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Click to select or drag & drop file
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between p-2">
            <div className="flex items-center space-x-3 truncate">
              <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate text-left">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Unknown type'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isUploading ? (
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin mr-1" /> Uploading...
                </div>
              ) : success ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {activeError && (
        <div className="flex items-center text-xs text-rose-600 dark:text-rose-400 font-medium space-x-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
};
