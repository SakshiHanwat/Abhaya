"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Send } from "lucide-react"
import { useLanguage } from "./language-context"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface DeviChatbotProps {
  isOpen: boolean
  onClose: () => void
}

// Loading dots animation
function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-3 px-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[#c9933a]"
          animate={{ y: [-3, 3, -3] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  )
}

// Chat bubble component
function ChatBubble({ message }: { message: Message }) {
  const isUser = message.isUser

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#4a2c2a] text-[#faf5f0] rounded-br-sm"
            : "bg-[#ffffff] border border-[#e5d8cc] text-[#4a2c2a] rounded-bl-sm"
        }`}
        style={
          !isUser
            ? { boxShadow: "0 2px 8px rgba(74, 44, 42, 0.1)" }
            : {}
        }
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
      </div>
    </motion.div>
  )
}

export function DeviChatbot({ isOpen, onClose }: DeviChatbotProps) {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Namaste 🙏 Main Devi hoon. Aapki suraksha ke liye yahan hoon. Kya poochna chahti hain?",
      isUser: false,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const sendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const userMessage = inputValue.trim()
    setInputValue("")

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      isUser: true,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      })
      const data = await res.json()

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (error) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Maafi chahti hoon, abhi connect nahi ho pa rahi! Thodi der baad try karein. 🙏",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Chat Sheet - 70% height */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-3xl overflow-hidden"
            style={{
              height: "70vh",
              background: "#faf5f0",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Border on top */}
            <div className="h-0.5 bg-[#e5d8cc]" />

            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-12 h-1 rounded-full bg-[#c9933a]/40" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5d8cc] bg-white">
              <div className="flex items-center gap-3">
                {/* Lotus avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{
                    background: "linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)",
                  }}
                >
                  🪷
                </div>
                <div>
                  <h2
                    className="text-[#4a2c2a] font-medium"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    Devi AI
                  </h2>
                  <p className="text-xs text-[#7a5c5a]">Your Safety Companion</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#faf5f0]"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4 text-[#7a5c5a]" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#faf5f0]">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))}
              {isTyping && (
                <div className="flex justify-start mb-3">
                  <div className="bg-white border border-[#e5d8cc] rounded-2xl rounded-bl-sm">
                    <LoadingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="px-4 py-3 border-t border-[#e5d8cc] bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Kuch bhi poochein..."
                  className="flex-1 bg-[#faf5f0] border border-[#e5d8cc] rounded-full py-3 px-4 text-[#4a2c2a] placeholder-[#7a5c5a] focus:border-[#c9933a] focus:outline-none focus:ring-1 focus:ring-[#c9933a]/20 transition-colors text-sm"
                />
                <motion.button
                  onClick={sendMessage}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: inputValue.trim()
                      ? "linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)"
                      : "#e5d8cc",
                  }}
                  whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
                  whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send
                    className="w-5 h-5"
                    style={{ color: inputValue.trim() ? "#faf5f0" : "#7a5c5a" }}
                  />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Floating button for triggering the chatbot
export function DeviFloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center text-2xl"
      style={{
        background: "linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)",
        boxShadow: "0 4px 20px rgba(74, 44, 42, 0.2)",
      }}
      animate={{
        boxShadow: [
          "0 4px 20px rgba(74, 44, 42, 0.2)",
          "0 4px 30px rgba(74, 44, 42, 0.4)",
          "0 4px 20px rgba(74, 44, 42, 0.2)",
        ],
      }}
      transition={{ duration: 2, repeat: Infinity }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      🪷
    </motion.button>
  )
}