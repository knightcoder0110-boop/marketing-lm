"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, ImageIcon, AlertCircle, Check, Camera, FolderOpen } from "lucide-react"
import { Button } from "./ui/button"
import { useToast } from "./Toasts"
import { validateImageFile } from "../utils/imageUtils"
import limits from "../config/limits.json"

interface UploadedFile {
  id: string
  file: File
  url: string
  status: "uploading" | "completed" | "error"
  progress: number
  error?: string
}

interface UploadDropzoneProps {
  onFileUpload: (file: File, url: string) => void
  onFileRemove?: (fileId: string) => void
  maxFiles?: number
  className?: string
}

export function UploadDropzone({ onFileUpload, onFileRemove, maxFiles = 5, className = "" }: UploadDropzoneProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()

  const handleFileValidation = useCallback(
    (file: File): boolean => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        addToast({
          type: "error",
          title: "Invalid file",
          message: validation.error,
          duration: 5000,
        })
        return false
      }
      return true
    },
    [addToast],
  )

  const processFile = useCallback(
    async (file: File): Promise<void> => {
      if (!handleFileValidation(file)) return

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        url: "",
        status: "uploading",
        progress: 0,
      }

      setUploadedFiles((prev) => [...prev, uploadedFile])

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, progress: Math.min(f.progress + 10, 90) } : f)),
          )
        }, 100)

        // Create object URL for preview
        const url = URL.createObjectURL(file)

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        clearInterval(progressInterval)

        // Update file status
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, url, status: "completed", progress: 100 } : f)),
        )

        onFileUpload(file, url)

        addToast({
          type: "success",
          title: "Upload successful",
          message: `${file.name} has been uploaded`,
          duration: 3000,
        })
      } catch (error) {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  error: "Upload failed. Please try again.",
                }
              : f,
          ),
        )

        addToast({
          type: "error",
          title: "Upload failed",
          message: "Please try uploading the file again",
          duration: 5000,
        })
      }
    },
    [handleFileValidation, onFileUpload, addToast],
  )

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return

      const fileArray = Array.from(files)
      const remainingSlots = maxFiles - uploadedFiles.length

      if (fileArray.length > remainingSlots) {
        addToast({
          type: "warning",
          title: "Too many files",
          message: `You can only upload ${remainingSlots} more file(s)`,
          duration: 4000,
        })
        return
      }

      fileArray.forEach(processFile)
    },
    [uploadedFiles.length, maxFiles, processFile, addToast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment")
      fileInputRef.current.click()
    }
  }, [])

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      const file = uploadedFiles.find((f) => f.id === fileId)
      if (file?.url) {
        URL.revokeObjectURL(file.url)
      }

      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
      onFileRemove?.(fileId)

      addToast({
        type: "info",
        title: "File removed",
        message: "File has been removed from upload queue",
        duration: 2000,
      })
    },
    [uploadedFiles, onFileRemove, addToast],
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={`space-y-4 overflow-hidden ${className}`}>
      {/* Upload Area */}
      <motion.div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 overflow-hidden
          ${
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={limits.upload.allowedFormats.join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Upload className={`w-8 h-8 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">{isDragOver ? "Drop files here" : "Upload Images"}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Drag and drop your images here, or choose from options below
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1 sm:flex-none">
                <FolderOpen className="w-4 h-4 mr-2" />
                Browse Files
              </Button>
              <Button onClick={handleCameraCapture} variant="outline" className="flex-1 sm:flex-none bg-transparent">
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Supported formats: JPEG, PNG, WebP</p>
              <p>Maximum size: {formatFileSize(limits.upload.maxSizeBytes)}</p>
              <p>Maximum files: {maxFiles}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            className="space-y-3 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h4 className="font-medium text-sm">
              Uploaded Files ({uploadedFiles.length}/{maxFiles})
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {uploadedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* File Preview */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {file.url ? (
                      <img
                        src={file.url || "/placeholder.svg"}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.file.size)}</p>

                    {/* Progress Bar */}
                    {file.status === "uploading" && (
                      <div className="mt-2">
                        <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                          <motion.div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            initial={{ width: 0 }}
                            animate={{ width: `${file.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{file.progress}% uploaded</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.status === "error" && file.error && (
                      <p className="text-xs text-destructive mt-1 truncate">{file.error}</p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {file.status === "uploading" && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    )}
                    {file.status === "completed" && <Check className="w-5 h-5 text-green-600" />}
                    {file.status === "error" && <AlertCircle className="w-5 h-5 text-destructive" />}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
