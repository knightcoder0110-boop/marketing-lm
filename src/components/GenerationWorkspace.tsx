"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Canvas } from "./Canvas"
import { PromptInput } from "./PromptInput"
import { ModesSelector } from "./ModesSelector"
import { UploadDropzone } from "./UploadDropzone"
import { MaskBrush } from "./MaskBrush"
import { Toolbar } from "./Toolbar"
import { JobQueue } from "./JobQueue"
import { Gallery } from "./Gallery"
import { BottomSheetMobile } from "./BottomSheetMobile"
import { useJobManager } from "../hooks/useJobManager"
import { useProgressiveImage } from "../hooks/useProgressiveImage"
import { useToast } from "./Toasts"
import { useMobile } from "../hooks/use-mobile"
import { ProgressIndicator } from "./ProgressIndicator"
import { ChatInput } from "./ChatInput"
import type { Mode, GenerationParams, EditParams } from "../types"
import modes from "../config/modes.json"

type WorkspaceMode = "generate" | "edit" | "mask" | "upload" | "history"

export function GenerationWorkspace() {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("generate")
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [selectedMode, setSelectedMode] = useState<string>("add-girlfriend")
  const [selectedPreset, setSelectedPreset] = useState<string>("photoreal")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [maskData, setMaskData] = useState<string | null>(null)
  const [showMobileControls, setShowMobileControls] = useState(false)

  const isMobile = useMobile()
  const { addToast } = useToast()

  const { activeJobs, completedJobs, isGenerating, startGeneration, startEditing, cancelJob, clearCompletedJobs } =
    useJobManager()

  // Get the most recent active job for progressive display
  const currentJob = activeJobs.length > 0 ? activeJobs[activeJobs.length - 1] : null
  const { currentImage, previewImages, isLoading, progress, eta } = useProgressiveImage(currentJob)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      addToast({
        type: "warning",
        title: "Missing prompt",
        message: "Please enter a prompt to generate an image",
        duration: 3000,
      })
      return
    }

    const selectedModeData = (modes as Mode[]).find((m) => m.id === selectedMode)
    if (!selectedModeData) {
      addToast({
        type: "error",
        title: "Invalid mode",
        message: "Please select a valid generation mode",
        duration: 3000,
      })
      return
    }

    const params: GenerationParams = {
      prompt,
      negativePrompt: negativePrompt || undefined,
      mode: selectedMode,
      size: selectedModeData.recommendedSize,
      aspectRatio: selectedModeData.defaultAspect,
      strength: selectedModeData.strengthDefault,
    }

    try {
      await startGeneration(params)
      setWorkspaceMode("generate") // Switch to canvas view
      if (isMobile) setShowMobileControls(false)
    } catch (error) {
      console.error("Generation failed:", error)
    }
  }, [prompt, negativePrompt, selectedMode, startGeneration, addToast, isMobile])

  const handleEdit = useCallback(async () => {
    if (!uploadedImage || !maskData || !prompt.trim()) {
      addToast({
        type: "warning",
        title: "Missing requirements",
        message: "Please upload an image, create a mask, and enter a prompt",
        duration: 4000,
      })
      return
    }

    const selectedModeData = (modes as Mode[]).find((m) => m.id === selectedMode)
    if (!selectedModeData) return

    const params: EditParams = {
      prompt,
      negativePrompt: negativePrompt || undefined,
      mode: selectedMode,
      size: selectedModeData.recommendedSize,
      aspectRatio: selectedModeData.defaultAspect,
      strength: selectedModeData.strengthDefault,
      imageUrl: uploadedImage,
      maskUrl: maskData,
    }

    try {
      await startEditing(params)
      setWorkspaceMode("generate") // Switch to canvas view
      if (isMobile) setShowMobileControls(false)
    } catch (error) {
      console.error("Editing failed:", error)
    }
  }, [uploadedImage, maskData, prompt, negativePrompt, selectedMode, startEditing, addToast, isMobile])

  const handleModeSelect = useCallback(
    (mode: Mode) => {
      setSelectedMode(mode.id)
      // Auto-fill prompt template if prompt is empty
      if (!prompt.trim()) {
        const templatePrompt = mode.promptTemplate.replace("{userPrompt}", "")
        setPrompt(templatePrompt.trim())
      }
    },
    [prompt],
  )

  const handleFileUpload = useCallback(
    (file: File, url: string) => {
      setUploadedImage(url)
      setWorkspaceMode("mask") // Switch to masking mode
      addToast({
        type: "success",
        title: "Image uploaded",
        message: "You can now create a mask for editing",
        duration: 3000,
      })
    },
    [addToast],
  )

  const handleJobRestore = useCallback(
    (job: any) => {
      if (job.finalUrl) {
        setUploadedImage(job.finalUrl)
        setWorkspaceMode("generate")
        addToast({
          type: "info",
          title: "Image restored",
          message: "Image has been loaded to the canvas",
          duration: 2000,
        })
      }
    },
    [addToast],
  )

  const handleChatMessage = useCallback(
    (message: string) => {
      setPrompt(message)
      // Auto-trigger generation if we have a complete prompt
      if (message.trim()) {
        handleGenerate()
      }
    },
    [handleGenerate],
  )

  const renderWorkspaceContent = () => {
    switch (workspaceMode) {
      case "upload":
        return <UploadDropzone onFileUpload={handleFileUpload} className="h-full" />

      case "mask":
        return <MaskBrush imageUrl={uploadedImage || undefined} onMaskChange={setMaskData} className="h-full" />

      case "history":
        return (
          <Gallery
            jobs={completedJobs}
            onRestore={handleJobRestore}
            onDelete={(jobId) => {
              // Remove from completed jobs
              console.log("Delete job:", jobId)
            }}
            className="h-full"
          />
        )

      default:
        return (
          <Canvas
            originalImage={uploadedImage || undefined}
            currentImage={currentImage || undefined}
            previewImages={previewImages}
            isLoading={isLoading}
            className="h-full"
          />
        )
    }
  }

  const renderMobileControls = () => (
    <div className="space-y-6 p-4">
      <ModesSelector selectedMode={selectedMode} onModeSelect={handleModeSelect} />

      <PromptInput
        prompt={prompt}
        negativePrompt={negativePrompt}
        onPromptChange={setPrompt}
        onNegativePromptChange={setNegativePrompt}
        onGenerate={() => setShowMobileControls(true)}
        isGenerating={isGenerating}
        selectedPreset={selectedPreset}
        onPresetChange={setSelectedPreset}
      />

      {activeJobs.length > 0 && <JobQueue jobs={activeJobs} onCancel={cancelJob} />}
    </div>
  )

  return (
    <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Toolbar */}
        {isMobile && (
          <div className="flex-shrink-0 p-4 border-b border-border bg-card">
            <Toolbar
              onGenerate={() => setShowMobileControls(true)}
              onEdit={() => setWorkspaceMode("mask")}
              onUpload={() => setWorkspaceMode("upload")}
              onMask={() => setWorkspaceMode("mask")}
              onHistory={() => setWorkspaceMode("history")}
              onDownload={() => {
                if (currentImage) {
                  const link = document.createElement("a")
                  link.href = currentImage
                  link.download = `generated-${Date.now()}.png`
                  link.click()
                }
              }}
              isGenerating={isGenerating}
              canDownload={!!currentImage}
              className="w-full"
            />
          </div>
        )}

        {/* Canvas/Workspace Content */}
        <div className="flex-1 p-4 min-h-0 overflow-hidden">{renderWorkspaceContent()}</div>

        {/* Progress Indicator */}
        {isLoading && (
          <div className="flex-shrink-0 p-4 border-t border-border bg-card">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <ProgressIndicator
                progress={progress}
                isActive={isLoading}
                eta={eta || undefined}
                onCancel={currentJob ? () => cancelJob(currentJob.jobId) : undefined}
              />
            </motion.div>
          </div>
        )}

        {isMobile && (
          <ChatInput
            onSendMessage={handleChatMessage}
            onFileUpload={handleFileUpload}
            isGenerating={isGenerating}
            className="flex-shrink-0 sticky bottom-0 z-10"
          />
        )}
      </div>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="w-96 min-w-96 max-w-96 border-l border-border bg-card flex flex-col h-full overflow-hidden">
          <div className="flex-shrink-0 p-6 border-b border-border">
            <Toolbar
              onGenerate={workspaceMode === "mask" ? handleEdit : handleGenerate}
              onEdit={() => setWorkspaceMode("mask")}
              onUpload={() => setWorkspaceMode("upload")}
              onMask={() => setWorkspaceMode("mask")}
              onHistory={() => setWorkspaceMode("history")}
              onDownload={() => {
                if (currentImage) {
                  const link = document.createElement("a")
                  link.href = currentImage
                  link.download = `generated-${Date.now()}.png`
                  link.click()
                }
              }}
              isGenerating={isGenerating}
              canDownload={!!currentImage}
            />
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
            <div className="p-6 space-y-6">
              <ModesSelector selectedMode={selectedMode} onModeSelect={handleModeSelect} />

              <PromptInput
                prompt={prompt}
                negativePrompt={negativePrompt}
                onPromptChange={setPrompt}
                onNegativePromptChange={setNegativePrompt}
                onGenerate={workspaceMode === "mask" ? handleEdit : handleGenerate}
                isGenerating={isGenerating}
                selectedPreset={selectedPreset}
                onPresetChange={setSelectedPreset}
              />

              {activeJobs.length > 0 && <JobQueue jobs={activeJobs} onCancel={cancelJob} />}
            </div>
          </div>

          <ChatInput
            onSendMessage={handleChatMessage}
            onFileUpload={handleFileUpload}
            isGenerating={isGenerating}
            className="flex-shrink-0 sticky bottom-0 z-10"
          />
        </div>
      )}

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <BottomSheetMobile
          isOpen={showMobileControls}
          onClose={() => setShowMobileControls(false)}
          title="Generation Controls"
        >
          {renderMobileControls()}
        </BottomSheetMobile>
      )}
    </div>
  )
}
