"use client";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@marble/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
} from "@marble/ui/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@marble/ui/components/ai-elements/prompt-input";
import { Globe } from "@phosphor-icons/react";
import { useState } from "react";
import { HiddenScrollbar } from "../hidden-scrollbar";
import { Response } from "@marble/ui/components/ai-elements/response";

export function ChatTab() {
  const [search, setSearch] = useState<boolean>(false);
  const [text, setText] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
    e.preventDefault();
    sendMessage(
      { text: text },
      {
        body: {
          model: "3o-mini",
        },
      },
    );
    setText("");
  };

  const { messages, status, sendMessage } = useChat();

  return (
    <HiddenScrollbar className="h-full px-6">
      <section className="flex flex-col h-full">
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Response key={`${message.id}-${i}`}>
                            {part.text}
                          </Response>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputTextarea
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton
                className={
                  search
                    ? "bg-accent text-accent-foreground dark:bg-accent/50"
                    : undefined
                }
                onClick={() => {
                  setSearch(!search);
                }}
              >
                <Globe size={16} />
                <span>Search</span>
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit disabled={!text} status={status} />
          </PromptInputToolbar>
        </PromptInput>
      </section>
    </HiddenScrollbar>
  );
}
