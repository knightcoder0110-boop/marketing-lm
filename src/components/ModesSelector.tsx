"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Heart, Camera, Palette, Sparkles } from "lucide-react"
import modes from "../config/modes.json"
import type { Mode } from "../types"

interface ModesSelectorProps {
  selectedMode?: string
  onModeSelect: (mode: Mode) => void
  className?: string
}

const modeIcons = {
  people: Heart,
  portrait: Camera,
  style: Palette,
  default: Sparkles,
}

export function ModesSelector({ selectedMode, onModeSelect, className = "" }: ModesSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)
  const typedModes = modes as Mode[]

  const getModeIcon = (category: string) => {
    return modeIcons[category as keyof typeof modeIcons] || modeIcons.default
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Generation Modes</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 overflow-hidden">
        {typedModes.map((mode) => {
          const IconComponent = getModeIcon(mode.category)
          const isSelected = selectedMode === mode.id
          const isHovered = hoveredMode === mode.id

          return (
            <motion.button
              key={mode.id}
              onClick={() => onModeSelect(mode)}
              onMouseEnter={() => setHoveredMode(mode.id)}
              onMouseLeave={() => setHoveredMode(null)}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all duration-200 overflow-hidden
                ${
                  isSelected
                    ? "border-primary bg-primary/30"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50"
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <motion.div
                  className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}

              {/* Mode Icon */}
              <div className="mb-4">
                <div
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center transition-colors
                    ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}
                  `}
                >
                  <IconComponent className="w-6 h-6" />
                </div>
              </div>

              {/* Mode Info */}
              <div className="space-y-2 overflow-hidden">
                <h4 className={`font-semibold text-base truncate ${isSelected ? "text-gray-900" : ""}`}>{mode.name}</h4>
                <p
                  className={`text-sm leading-relaxed line-clamp-2 ${isSelected ? "text-gray-700" : "text-muted-foreground"}`}
                >
                  {mode.description}
                </p>

                {/* Mode Details */}
                <div className="pt-2 space-y-1">
                  <div
                    className={`flex items-center justify-between text-xs ${isSelected ? "text-gray-600" : "text-muted-foreground"}`}
                  >
                    <span className="truncate">Aspect Ratio</span>
                    <span className="font-medium ml-2 flex-shrink-0">{mode.defaultAspect}</span>
                  </div>
                  <div
                    className={`flex items-center justify-between text-xs ${isSelected ? "text-gray-600" : "text-muted-foreground"}`}
                  >
                    <span className="truncate">Recommended Size</span>
                    <span className="font-medium ml-2 flex-shrink-0">{mode.recommendedSize}</span>
                  </div>
                  {mode.preserveFaces && (
                    <div
                      className={`flex items-center space-x-1 text-xs ${isSelected ? "text-green-700" : "text-green-400"}`}
                    >
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="truncate">Preserves faces</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 opacity-0"
                animate={{ opacity: isHovered && !isSelected ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          )
        })}
      </div>

      {/* Mode Template Preview */}
      {selectedMode && (
        <motion.div
          className="p-4 bg-muted rounded-lg border border-border overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <h4 className="font-medium text-sm mb-2">Prompt Template Preview</h4>
          <p className="text-xs text-muted-foreground font-mono bg-card p-3 rounded border break-words overflow-wrap-anywhere">
            {typedModes
              .find((m) => m.id === selectedMode)
              ?.promptTemplate.replace("{userPrompt}", "[Your prompt will be inserted here]")}
          </p>
        </motion.div>
      )}
    </div>
  )
}
