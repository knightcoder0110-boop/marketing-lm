"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Upload, ImageIcon, Camera } from "lucide-react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { useToast } from "./Toasts"
import { useMobile } from "../hooks/use-mobile"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  onFileUpload: (file: File, url: string) => void
  isGenerating?: boolean
  className?: string
}

const mobileSuggestions = [
  "Add a beautiful girlfriend",
  "Make her smile more",
  "Change the background",
  "Add romantic lighting",
  "Make it more realistic",
  "Add vintage style",
  "Enhance the colors",
  "Make it artistic",
]

export function ChatInput({ onSendMessage, onFileUpload, isGenerating = false, className = "" }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addToast } = useToast()
  const isMobile = useMobile()

  const handleSend = useCallback(() => {
    if (!message.trim() || isGenerating) return

    onSendMessage(message.trim())
    setMessage("")

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [message, onSendMessage, isGenerating])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const file = files[0]

      // Validate file type
      if (!file.type.startsWith("image/")) {
        addToast({
          type: "error",
          title: "Invalid file type",
          message: "Please select an image file",
          duration: 3000,
        })
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        addToast({
          type: "error",
          title: "File too large",
          message: "Please select an image smaller than 10MB",
          duration: 3000,
        })
        return
      }

      const url = URL.createObjectURL(file)
      onFileUpload(file, url)

      addToast({
        type: "success",
        title: "Image uploaded",
        message: "Image ready for processing",
        duration: 2000,
      })
    },
    [onFileUpload, addToast],
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

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setMessage(suggestion)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleCameraCapture = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment")
      fileInputRef.current.click()
    }
  }, [])

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }, [])

  return (
    <div className={`bg-card border-t border-border ${className}`}>
      {/* Mobile Suggestions */}
      {isMobile && (
        <div className="p-3 border-b border-border">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {mobileSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="whitespace-nowrap flex-shrink-0 h-8 px-3 text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div
        className={`p-4 ${isDragOver ? "bg-primary/5" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="flex items-end gap-3">
          {/* Upload Button */}
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 p-0"
              title="Upload image"
            >
              <Upload className="w-4 h-4" />
            </Button>

            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCameraCapture}
                className="h-10 w-10 p-0 bg-transparent"
                title="Take photo"
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder={isDragOver ? "Drop image here..." : "Type your message..."}
              className="min-h-[44px] max-h-[120px] resize-none pr-12 py-3"
              disabled={isGenerating}
            />

            {/* Drag overlay */}
            <AnimatePresence>
              {isDragOver && (
                <motion.div
                  className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-md flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-2 text-primary">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">Drop image here</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Send Button */}
          <Button onClick={handleSend} disabled={!message.trim() || isGenerating} size="sm" className="h-10 w-10 p-0">
            {isGenerating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Character count */}
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>{message.length}/500</span>
          {isDragOver && <span className="text-primary">Drop image to upload</span>}
        </div>
      </div>
    </div>
  )
}
