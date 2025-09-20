"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@marble/ui/components/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@marble/ui/components/command";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@marble/ui/components/tooltip";
import { cn } from "@marble/ui/lib/utils";
import { CaretUpDownIcon, CheckIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { type Control, useController } from "react-hook-form";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { PostValues } from "@/lib/validations/post";
import { useUser } from "@/providers/user";
import { ErrorMessage } from "../../auth/error-message";
import { FieldInfo } from "./field-info";

interface AuthorOptions {
  id: string;
  name: string;
  image: string | null;
  userId: string | null;
}

interface AuthorSelectorProps {
  control: Control<PostValues>;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  defaultAuthors?: string[];
}

export function AuthorSelector({
  control,
  placeholder,
  isOpen,
  setIsOpen,
  defaultAuthors = [],
}: AuthorSelectorProps) {
  const {
    field: { onChange, value },
    fieldState: { error },
  } = useController({
    name: "authors",
    control,
    defaultValue: defaultAuthors,
  });

  const [selected, setSelected] = useState<AuthorOptions[]>([]);
  const { user } = useUser();
  const workspaceId = useWorkspaceId();
  const isNewPost = defaultAuthors.length === 0;

  const { data: authors = [], isLoading } = useQuery<AuthorOptions[]>({
    // biome-ignore lint/style/noNonNullAssertion: <>
    queryKey: QUERY_KEYS.AUTHORS(workspaceId!),
    queryFn: async () => {
      try {
        const response = await fetch("/api/authors");
        if (!response.ok) {
          throw new Error("Failed to fetch authors");
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Failed to fetch authors:", error);
        return [];
      }
    },
    enabled: !!workspaceId,
  });

  // Memoize the primary author to avoid recalculation
  const derivedPrimaryAuthor = useMemo(() => {
    if (!user || authors.length === 0) {
      return undefined;
    }
    return authors.find((author) => author.userId === user.id) || authors[0];
  }, [user, authors]);

  // Handle selected authors based on form value
  // This is just to show the selected users in the UI
  useEffect(() => {
    if (isLoading || authors.length === 0) {
      return;
    }

    if (value.length > 0) {
      const authorsThatWerePreviouslySelected = authors.filter((opt) =>
        value.includes(opt.id)
      );
      setSelected(authorsThatWerePreviouslySelected);
    } else {
      setSelected([]);
    }
  }, [value, authors, isLoading]);

  // Auto-select current user's author profile on initial load for better UX
  // This makes it obvious who is creating the content and saves them from
  // having to manually select themselves for original content.
  // The user can always remove themselves from the list if they want to.
  // In a case where they are publishing on behalf of another author, they can select them from the list.
  // This auto select is only for new posts, not when editing.
  // Check the post creation route to see how this is handled.
  useEffect(() => {
    if (
      authors.length > 0 &&
      derivedPrimaryAuthor &&
      (!value || value.length === 0) &&
      !isLoading &&
      isNewPost
    ) {
      onChange([derivedPrimaryAuthor.id]);
      console.log("auto selected primary author", derivedPrimaryAuthor);
    }
  }, [authors, derivedPrimaryAuthor, onChange, isLoading, value, isNewPost]);

  const addOrRemoveAuthor = (authorToAdd: string) => {
    const currentValues = value || [];
    let newValue = currentValues.includes(authorToAdd)
      ? currentValues.filter((id) => id !== authorToAdd)
      : [...currentValues, authorToAdd];

    if (
      derivedPrimaryAuthor &&
      newValue.length === 0 &&
      currentValues.includes(derivedPrimaryAuthor.id) &&
      authorToAdd === derivedPrimaryAuthor.id
    ) {
      newValue = [derivedPrimaryAuthor.id];
    }

    if (newValue.length === 0 && derivedPrimaryAuthor) {
      newValue = [derivedPrimaryAuthor.id];
    }

    onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="authors">Authors</Label>
        <FieldInfo text="List of authors who contributed to the article." />
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger>
          <div className="bg-editor-field relative flex h-auto min-h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm">
            <ul className="flex flex-wrap -space-x-2">
              {selected.length === 0 && (
                <li className="text-muted-foreground">
                  {placeholder || "Select authors"}
                </li>
              )}
              {selected.length === 1 && (
                <li className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarImage src={selected[0]?.image || undefined} />
                    <AvatarFallback>
                      {selected[0]?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="max-w-64 text-sm">{selected[0]?.name}</p>
                </li>
              )}
              {selected.length > 1 &&
                selected.map((author) => (
                  <li key={author.id} className="flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="size-6">
                          <AvatarImage src={author.image || undefined} />
                          <AvatarFallback>
                            {author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-64 text-xs">{author.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
            </ul>
            <CaretUpDownIcon className="size-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <PopoverContent className="min-w-[350.67px] p-0" align="start">
          <Command className="w-full">
            <CommandInput placeholder="Search authors..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading authors..." : "No authors found."}
              </CommandEmpty>
              {authors && authors.length > 0 && (
                <CommandGroup>
                  {authors.map((option) => (
                    <CommandItem
                      key={option.id}
                      id={option.id}
                      onSelect={() => {
                        addOrRemoveAuthor(option.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={option.image || undefined} />
                          <AvatarFallback>
                            {option.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="max-w-64">{option.name}</p>
                      </div>
                      <CheckIcon
                        className={cn(
                          "ml-auto h-4 w-4",
                          selected.some((item) => item.id === option.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {authors && authors.length > 0 && <CommandSeparator />}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
