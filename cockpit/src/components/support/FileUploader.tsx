/**
 * FileUploader Component (Phase 2 - Multi-file Attachments)
 * Allows users to upload multiple files (images, PDFs, documents, logs)
 */

import { useState } from 'react';
import { uploadFileToCloudinary, formatFileSize } from '../../lib/cloudinary';
import { X, Upload, File, FileText, Image, Archive } from 'lucide-react';

export interface FileAttachment {
  url: string;
  filename: string;
  type: string;
  size: number;
}

interface FileUploaderProps {
  onFilesUploaded: (files: FileAttachment[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in bytes
  allowedTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/json',
  'application/xml',
  'text/xml',
  'application/zip',
  'application/x-zip-compressed',
];

export default function FileUploader({
  onFilesUploaded,
  maxFiles = 5,
  maxSizePerFile = 10 * 1024 * 1024, // 10MB
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  disabled = false,
}: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);

    // Reset error
    setError(null);

    // Validate number of files
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    for (const file of files) {
      // Check size
      if (file.size > maxSizePerFile) {
        setError(`File "${file.name}" exceeds ${formatFileSize(maxSizePerFile)} limit`);
        return;
      }

      // Check type
      if (!allowedTypes.includes(file.type)) {
        setError(`File type "${file.type}" is not allowed for "${file.name}"`);
        return;
      }
    }

    // Add to selected files
    setSelectedFiles((prev) => [...prev, ...files]);

    // Reset input
    e.target.value = '';
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    const uploaded: FileAttachment[] = [];

    try {
      for (const [_index, file] of selectedFiles.entries()) {
        // Update progress
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        // Upload to Cloudinary
        const result = await uploadFileToCloudinary(file, 'support-attachments', maxSizePerFile);

        // Add to uploaded list
        uploaded.push({
          url: result.secure_url,
          filename: file.name,
          type: file.type,
          size: file.size,
        });

        // Update progress
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
      }

      // Callback with uploaded files
      onFilesUploaded(uploaded);

      // Clear selected files
      setSelectedFiles([]);
      setUploadProgress({});
    } catch (err: any) {
      console.error('[FileUploader] Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-400" />;
    } else if (type === 'application/pdf') {
      return <FileText className="w-5 h-5 text-red-400" />;
    } else if (type.includes('zip') || type.includes('archive')) {
      return <Archive className="w-5 h-5 text-yellow-400" />;
    } else {
      return <File className="w-5 h-5 text-slate-400" />;
    }
  }

  return (
    <div className="space-y-3">
      {/* File input */}
      <div>
        <label
          htmlFor="file-upload"
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed transition cursor-pointer ${
            disabled || uploading
              ? 'border-slate-700 bg-slate-800/50 cursor-not-allowed opacity-50'
              : 'border-slate-600 bg-slate-800/30 hover:border-cyan-500 hover:bg-slate-800/50'
          }`}
        >
          <Upload className="w-5 h-5 text-slate-400" />
          <span className="text-sm text-slate-300">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} fichier(s) sélectionné(s)`
              : `Choisir des fichiers (max ${maxFiles})`}
          </span>
          <input
            id="file-upload"
            type="file"
            multiple
            accept={allowedTypes.join(',')}
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="hidden"
          />
        </label>

        <p className="mt-1 text-xs text-slate-500">
          Images, PDFs, documents, logs, JSON, XML, ZIP - Max {formatFileSize(maxSizePerFile)} par fichier
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
            >
              {/* File icon */}
              {getFileIcon(file.type)}

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{file.name}</div>
                <div className="text-xs text-slate-400">{formatFileSize(file.size)}</div>

                {/* Upload progress */}
                {uploading && uploadProgress[file.name] !== undefined && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 transition-all duration-300"
                        style={{ width: `${uploadProgress[file.name]}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Remove button */}
              {!uploading && (
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={uploading || disabled}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Upload en cours...
              </div>
            ) : (
              `Upload ${selectedFiles.length} fichier(s)`
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * FileAttachmentDisplay Component
 * Display uploaded file attachments with download links
 */
interface FileAttachmentDisplayProps {
  attachments: FileAttachment[];
}

export function FileAttachmentDisplay({ attachments }: FileAttachmentDisplayProps) {
  if (!attachments || attachments.length === 0) return null;

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-400" />;
    } else if (type === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-400" />;
    } else if (type.includes('zip') || type.includes('archive')) {
      return <Archive className="w-4 h-4 text-yellow-400" />;
    } else {
      return <File className="w-4 h-4 text-slate-400" />;
    }
  }

  return (
    <div className="mt-2 space-y-1.5">
      {attachments.map((file, index) => (
        <a
          key={index}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-700/30 text-sm text-cyan-400 hover:text-cyan-300 transition group"
        >
          {getFileIcon(file.type)}
          <span className="flex-1 truncate group-hover:underline">{file.filename}</span>
          <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
        </a>
      ))}
    </div>
  );
}
