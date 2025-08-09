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
import { CaretUpDown, Check, Info } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { type Control, useController } from "react-hook-form";
import type { PostValues } from "@/lib/validations/post";
import { useUser } from "@/providers/user";
import { useWorkspace } from "@/providers/workspace";
import { ErrorMessage } from "../../auth/error-message";

interface AuthorOptions {
  id: string;
  name: string;
  image: string;
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
  const { activeWorkspace } = useWorkspace();

  // Transform workspace members into author options
  const authors = useMemo(() => {
    if (!activeWorkspace?.members) {
      return [];
    }

    return activeWorkspace.members.map((member) => ({
      id: member.userId,
      name: member.user.name || member.user.email,
      image: member.user.image || "",
    }));
  }, [activeWorkspace?.members]);

  const derivedPrimaryAuthor: AuthorOptions | undefined = user
    ? {
        id: user.id,
        name: user.name,
        image: user.image || "",
      }
    : undefined;

  useEffect(() => {
    if (authors && authors.length > 0 && value?.length > 0) {
      const selectedAuthors = authors.filter((opt) => value.includes(opt.id));
      setSelected(selectedAuthors);
    } else {
      setSelected([]);
    }
  }, [value, authors]);

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

  const isLoading = !(activeWorkspace && authors.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Label htmlFor="authors">Authors</Label>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Info className="size-4 text-gray-400" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-64 text-muted-foreground text-xs">
              List of authors who contributed to the article.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      <Popover onOpenChange={setIsOpen} open={isOpen}>
        <PopoverTrigger>
          <div className="relative flex h-auto min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm">
            <ul className="-space-x-2 flex flex-wrap">
              {selected.length === 0 && (
                <li className="text-muted-foreground">
                  {placeholder || "Select authors"}
                </li>
              )}
              {selected.length === 1 && (
                <li className="flex items-center gap-2">
                  <Avatar className="size-7">
                    <AvatarImage src={selected[0]?.image} />
                    <AvatarFallback>
                      {selected[0]?.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="max-w-64 text-sm">{selected[0]?.name}</p>
                </li>
              )}
              {selected.length > 1 &&
                selected.map((author) => (
                  <li className="flex items-center" key={author.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Avatar className="size-7">
                          <AvatarImage src={author.image} />
                          <AvatarFallback>
                            {author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-64 text-muted-foreground text-xs">
                          {author.name}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
            </ul>
            <CaretUpDown className="size-4 shrink-0 opacity-50" />
          </div>
        </PopoverTrigger>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <PopoverContent align="start" className="min-w-[350.67px] p-0">
          <Command className="w-full">
            <CommandInput placeholder="Search team members..." />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading authors..." : "No results found."}
              </CommandEmpty>
              {authors && authors.length > 0 && (
                <CommandGroup>
                  {authors.map((option) => (
                    <CommandItem
                      id={option.id}
                      key={option.id}
                      onSelect={() => {
                        addOrRemoveAuthor(option.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={option.image} />
                          <AvatarFallback>
                            {option.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="max-w-64">{option.name}</p>
                      </div>
                      <Check
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
