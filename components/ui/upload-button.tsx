import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@fluentui/react-components";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFileName(file.name);
      onFileSelect(file);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
        // Must match the upload route's allowlist; `image/*` would let the user
        // pick a file the API then rejects with a 400.
        accept="image/png,image/jpeg,image/webp"
      />
      <Button onClick={handleSelectFile}>
        <Upload className="mr-2 h-4 w-4" /> Select Icon
      </Button>
      {selectedFileName && (
        <p className="text-sm text-gray-500">
          Selected file: {selectedFileName}
        </p>
      )}
    </div>
  );
};

export default FileUploader;
