"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { ArrowLeft, Send, User, Building2, Briefcase, Check, CheckCheck, Paperclip, X, FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { sendMessage, markMessagesAsRead, uploadAttachment, getSignedUrl } from "@/lib/messages/actions";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  issue_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
}

interface ConversationContext {
  issue: {
    id: string;
    title: string;
    status: string;
  };
  participant: {
    id: string;
    name: string | null;
    avatar: string | null;
    role: string;
  };
  isBusinessOwner: boolean;
}

interface ChatInterfaceProps {
  issueId: string;
  participantId: string;
  currentUserId: string;
  context: ConversationContext;
  initialMessages: Message[];
}

function formatMessageTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isYesterday) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

// Component to display attachments with signed URLs
function AttachmentDisplay({
  filePath,
  fileName,
  fileType,
  fileSize,
  isMine,
  formatFileSize,
}: {
  filePath: string;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  isMine: boolean;
  formatFileSize: (bytes: number) => string;
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isImage = fileType?.startsWith("image/");

  // Fetch signed URL for images on mount
  useEffect(() => {
    if (isImage && filePath) {
      setIsLoading(true);
      console.log("AttachmentDisplay - Fetching signed URL for:", filePath);
      getSignedUrl(filePath)
        .then((result) => {
          console.log("AttachmentDisplay - Result:", result);
          if (result.url) {
            setSignedUrl(result.url);
          } else {
            setErrorMsg(result.error || "Failed to load");
          }
        })
        .catch((err) => {
          console.error("AttachmentDisplay - Error:", err);
          setErrorMsg("Failed to load attachment");
        })
        .finally(() => setIsLoading(false));
    }
  }, [filePath, isImage]);

  // Handle download for non-image files
  const handleDownload = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await getSignedUrl(filePath);
      console.log("Download - Result:", result);
      if (result.url) {
        // Open in new tab or trigger download
        window.open(result.url, "_blank");
      } else {
        setErrorMsg(result.error || "Failed to load");
      }
    } catch (err) {
      console.error("Download error:", err);
      setErrorMsg("Failed to download");
    } finally {
      setIsLoading(false);
    }
  };

  if (errorMsg) {
    return (
      <div className={`p-2 rounded-lg text-xs ${isMine ? "text-white/70" : "text-slate-500"}`}>
        {errorMsg}
      </div>
    );
  }

  if (isImage) {
    return (
      <div className="relative rounded-lg overflow-hidden max-w-xs">
        {isLoading ? (
          <div className="w-48 h-32 flex items-center justify-center bg-slate-200 rounded-lg">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : signedUrl ? (
          <img
            src={signedUrl}
            alt={fileName || "Image"}
            className="max-w-full h-auto rounded-lg"
            style={{ maxHeight: "200px" }}
          />
        ) : null}
      </div>
    );
  }

  // Non-image file - show download button
  return (
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors w-full text-left ${
        isMine
          ? "border-white/30 hover:bg-white/10"
          : "border-slate-200 hover:bg-slate-50"
      } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
    >
      {isLoading ? (
        <Loader2 className={`w-8 h-8 flex-shrink-0 animate-spin ${isMine ? "text-white" : "text-slate-500"}`} />
      ) : (
        <FileText className={`w-8 h-8 flex-shrink-0 ${isMine ? "text-white" : "text-slate-500"}`} />
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isMine ? "text-white" : "text-slate-900"}`}>
          {fileName || "File"}
        </p>
        <p className={`text-xs ${isMine ? "text-white/70" : "text-slate-500"}`}>
          {fileSize ? formatFileSize(fileSize) : ""}
        </p>
      </div>
      <Download className={`w-4 h-4 flex-shrink-0 ${isMine ? "text-white" : "text-slate-400"}`} />
    </button>
  );
}

export function ChatInterface({
  issueId,
  participantId,
  currentUserId,
  context,
  initialMessages,
}: ChatInterfaceProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to new messages and updates (for seen status)
    const channel = supabase
      .channel(`messages:${issueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `issue_id=eq.${issueId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // Only add if it's part of this conversation
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === participantId) ||
            (newMsg.sender_id === participantId && newMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            // Mark as read if we received it
            if (newMsg.receiver_id === currentUserId) {
              markMessagesAsRead(issueId, participantId);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `issue_id=eq.${issueId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          // Update the message in state (for is_read status)
          if (
            (updatedMsg.sender_id === currentUserId && updatedMsg.receiver_id === participantId) ||
            (updatedMsg.sender_id === participantId && updatedMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [issueId, participantId, currentUserId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || isSending || isUploading) return;

    setIsSending(true);
    setError(null);

    try {
      let attachment = undefined;

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const uploadResult = await uploadAttachment(formData);
        
        if (uploadResult.error) {
          setError(uploadResult.error);
          setIsSending(false);
          setIsUploading(false);
          return;
        }
        
        attachment = uploadResult.attachment;
        setIsUploading(false);
      }

      const result = await sendMessage({
        receiverId: participantId,
        issueId,
        content: newMessage.trim(),
        attachment,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setNewMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        inputRef.current?.focus();
        // The realtime subscription will add the message
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link
            href="/messages"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>

          <Link 
            href={`/profile/${context.participant.role}/${context.participant.id}`}
            className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden relative flex-shrink-0 ring-2 ring-transparent hover:ring-primary transition-all"
          >
            {context.participant.avatar ? (
              <Image
                src={context.participant.avatar}
                alt={context.participant.name || "User"}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {context.participant.role === "business" ? (
                  <Building2 className="w-5 h-5 text-slate-400" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <Link 
              href={`/profile/${context.participant.role}/${context.participant.id}`}
              className="font-semibold text-slate-900 truncate hover:text-primary transition-colors"
            >
              {context.participant.name || "User"}
            </Link>
            <Link
              href={`/issues/${issueId}`}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-primary transition-colors"
            >
              <Briefcase className="w-3 h-3" />
              <span className="truncate">{context.issue.title}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Start the conversation</h3>
              <p className="text-slate-500">Send a message to begin collaborating</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMine = message.sender_id === currentUserId;
              const showTimestamp =
                index === 0 ||
                new Date(message.created_at).getTime() -
                  new Date(messages[index - 1].created_at).getTime() >
                  300000; // 5 minutes
              
              // Check if this is the last message from me and show seen status
              const isLastFromMe = isMine && 
                !messages.slice(index + 1).some(m => m.sender_id === currentUserId);

              return (
                <div key={message.id}>
                  {showTimestamp && (
                    <div className="text-center text-xs text-slate-400 my-4">
                      {formatMessageTime(new Date(message.created_at))}
                    </div>
                  )}
                  <div
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex flex-col max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-slate-100 text-slate-900 rounded-bl-md"
                        }`}
                      >
                        {/* Attachment display */}
                        {message.attachment_url && (
                          <div className="mb-2">
                            <AttachmentDisplay
                              filePath={message.attachment_url}
                              fileName={message.attachment_name}
                              fileType={message.attachment_type}
                              fileSize={message.attachment_size}
                              isMine={isMine}
                              formatFileSize={formatFileSize}
                            />
                          </div>
                        )}
                        {/* Message content - hide if it's just the default file message */}
                        {message.content && !message.content.startsWith("Sent a file:") && (
                          <p className="whitespace-pre-wrap break-words text-sm">
                            {message.content}
                          </p>
                        )}
                      </div>
                      {/* Seen indicator for sent messages */}
                      {isMine && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                          {message.is_read ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-primary" />
                              {isLastFromMe && <span className="text-primary">Seen</span>}
                            </>
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border-t border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {/* File preview */}
          {selectedFile && (
            <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                {selectedFile.type.startsWith("image/") ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-end gap-3">
            {/* File upload button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isUploading}
              className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-slate-500" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedFile ? "Add a message (optional)..." : "Type a message..."}
                rows={1}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none max-h-32 overflow-y-auto"
                style={{ minHeight: "48px" }}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
              loading={isSending || isUploading}
              className="!px-4 !py-3"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {isUploading ? "Uploading file..." : "Press Enter to send, Shift+Enter for new line • Max file size: 5MB"}
          </p>
        </div>
      </div>
    </div>
  );
}

