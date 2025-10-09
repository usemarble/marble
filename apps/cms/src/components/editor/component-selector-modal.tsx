"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
import { Calendar } from "@marble/ui/components/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@marble/ui/components/card";
import { Checkbox } from "@marble/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@marble/ui/components/dialog";
import { Input } from "@marble/ui/components/input";
import { Label } from "@marble/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@marble/ui/components/popover";
import { Textarea } from "@marble/ui/components/textarea";
import { cn } from "@marble/ui/lib/utils";
import {
  ArrowLeftIcon,
  CalendarDotsIcon,
  PuzzlePieceIcon,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { ComponentProperty, CustomComponent } from "../components/columns";
import { LoadingSpinner } from "../ui/async-button";
import { VirtualizedSelect } from "../ui/virtualized-select";

type Primitive = string | number | boolean | null;

type NodeAttrs = {
  componentName?: string;
  technicalName?: string;
  instanceId?: string;
  properties?: Record<string, Primitive>;
};

type ExistingNode = { attrs?: NodeAttrs } | null;

// For number inputs: allow number or empty string
const asNumberValue = (v: Primitive): number | string =>
  typeof v === "number" ? v : typeof v === "string" ? v : "";

type ComponentEditorModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editor: Editor;
  existingComponent: ExistingNode;
  getPos?: () => number;
  postId?: string;
};

export function ComponentEditorModal({
  isOpen,
  setIsOpen,
  editor,
  existingComponent,
  getPos,
  postId,
}: ComponentEditorModalProps) {
  const [propertyValues, setPropertyValues] = useState<
    Record<string, Primitive>
  >({});
  const workspaceId = useWorkspaceId();

  const { data: components = [] } = useQuery<CustomComponent[]>({
    queryKey: ["custom-components", workspaceId],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const response = await fetch("/api/custom-components");
      if (!response.ok) {
        throw new Error("Failed to fetch components");
      }
      return (await response.json()) as CustomComponent[];
    },
    enabled: !!workspaceId,
  });

  const componentDef =
    existingComponent && components.length > 0
      ? (components.find(
          (c) =>
            c.name ===
            ((existingComponent.attrs ?? {}) as NodeAttrs).componentName
        ) ?? null)
      : null;

  useEffect(() => {
    if (existingComponent && componentDef) {
      const attrs = (existingComponent.attrs ?? {}) as NodeAttrs;
      const props = attrs.properties ?? {};
      const existingValues: Record<string, Primitive> = {};
      for (const [key, value] of Object.entries(props)) {
        existingValues[key] = value ?? "";
      }
      setPropertyValues(existingValues);
    }
  }, [existingComponent, componentDef]);

  const handlePropertyChange = (propertyName: string, value: Primitive) => {
    setPropertyValues((prev) => ({
      ...prev,
      [propertyName]: value,
    }));
  };

  // Validate required fields for editing
  const validateEditFields = (): boolean => {
    if (!componentDef) {
      return false;
    }
    return componentDef.properties
      .filter((prop) => prop.required)
      .every((prop) => {
        const value = propertyValues[prop.name];
        return value !== undefined && value !== "" && value !== null;
      });
  };

  const handleUpdateComponent = async (): Promise<void> => {
    if (!componentDef || !editor) {
      return;
    }
    if (!validateEditFields()) {
      console.warn("Please fill in all required fields");
      return;
    }

    const componentData: Record<string, Primitive> = {};
    for (const prop of componentDef.properties) {
      const raw = propertyValues[prop.name];
      if (raw !== undefined && raw !== "") {
        componentData[prop.name] =
          prop.type === "number" && typeof raw === "string"
            ? raw.trim() === ""
              ? ""
              : Number(raw)
            : raw;
      }
    }

    const attrs = (existingComponent?.attrs ?? {}) as NodeAttrs;
    const instanceId = attrs.instanceId;

    // If instance exists, update it immediately
    if (postId && componentDef.id && instanceId) {
      try {
        const response = await fetch(
          `/api/custom-components/instances/${instanceId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: componentData }),
          }
        );
        if (!response.ok) {
          console.warn("Failed to update component instance");
        }
      } catch (error) {
        console.error("Error managing component instance:", error);
      }
    }

    const chain = editor.chain().focus();

    const pos = typeof getPos === "function" ? getPos() : null;
    if (typeof pos === "number") {
      chain.setNodeSelection(pos);
    }

    chain
      .updateAttributes("customComponent", {
        componentName: componentDef.name,
        technicalName: componentDef.technicalName,
        instanceId,
        properties: componentData,
      })
      .run();

    handleClose();
  };

  const handleClose = (): void => {
    setIsOpen(false);
  };

  const renderPropertyInput = (property: ComponentProperty) => {
    const value: Primitive = propertyValues[property.name] ?? "";

    switch (property.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true}
              id={property.name}
              onCheckedChange={(checked) =>
                handlePropertyChange(property.name, checked === true)
              }
            />
            <Label htmlFor={property.name}>Enable {property.name}</Label>
          </div>
        );

      case "textarea":
        return (
          <Textarea
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            rows={3}
            value={(value ?? "") as string}
          />
        );

      case "select":
        return (
          <VirtualizedSelect
            onValueChange={(newValue) =>
              handlePropertyChange(property.name, newValue)
            }
            options={property.options || []}
            placeholder={`Select ${property.name}`}
            value={(value ?? "") as string}
          />
        );

      case "number":
        return (
          <Input
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            type="number"
            value={asNumberValue(value)}
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  "justify-between bg-editor-field text-left font-normal shadow-none",
                  !value && "text-muted-foreground"
                )}
                variant="outline"
              >
                {value ? (
                  format(new Date(value as string), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarDotsIcon className="text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0">
              <Calendar
                autoFocus
                captionLayout="dropdown"
                mode="single"
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    handlePropertyChange(property.name, date.toISOString());
                  }
                }}
                selected={value ? new Date(value as string) : undefined}
              />
            </PopoverContent>
          </Popover>
        );

      case "email":
        return (
          <Input
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            type="email"
            value={String(value ?? "")}
          />
        );

      case "url":
        return (
          <Input
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            type="url"
            value={String(value ?? "")}
          />
        );

      default:
        return (
          <Input
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            value={String(value ?? "")}
          />
        );
    }
  };

  if (!componentDef) {
    console.warn(
      "ComponentEditorModal: Component definition not found for:",
      (existingComponent?.attrs as NodeAttrs | undefined)?.componentName
    );
    return (
      <Dialog onOpenChange={handleClose} open={isOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              Component definition not found. Please try again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent
        className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit {componentDef.name}</DialogTitle>
          <DialogDescription>
            Configure the properties for your component
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            {componentDef.properties.map((property) => (
              <div className="space-y-2" key={property.id}>
                <Label className="flex items-center">
                  <span className="flex items-center gap-x-1">
                    {property.name}
                    {property.required && (
                      <span className="text-red-500">*</span>
                    )}
                  </span>
                  <Badge className="ml-2 text-xs" variant="outline">
                    {property.type}
                  </Badge>
                </Label>
                {renderPropertyInput(property)}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!validateEditFields()}
              onClick={handleUpdateComponent}
            >
              Update Component
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ComponentSelectorModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editor?: Editor;
  existingComponent?: ExistingNode;
  getPos?: () => number;
  postId?: string;
};

export function ComponentSelectorModal({
  isOpen,
  setIsOpen,
  editor,
  existingComponent,
  getPos,
}: ComponentSelectorModalProps) {
  const [selectedComponent, setSelectedComponent] =
    useState<CustomComponent | null>(null);
  const [propertyValues, setPropertyValues] = useState<
    Record<string, Primitive>
  >({});
  const workspaceId = useWorkspaceId();

  const { data: components = [], isLoading } = useQuery<CustomComponent[]>({
    queryKey: ["custom-components", workspaceId],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const response = await fetch("/api/custom-components");
      if (!response.ok) {
        throw new Error("Failed to fetch components");
      }
      return (await response.json()) as CustomComponent[];
    },
    enabled: !!workspaceId,
  });

  const getDefaultValueForType = useCallback(
    (type: ComponentProperty["type"]): Primitive => {
      switch (type) {
        case "boolean":
          return false;
        case "number":
          return "";
        case "date": {
          const [d = ""] = new Date().toISOString().split("T");
          return d;
        }
        default:
          return "";
      }
    },
    []
  );

  useEffect(() => {
    if (existingComponent && components.length > 0) {
      const attrs = (existingComponent.attrs ?? {}) as NodeAttrs;
      const props = attrs.properties ?? {};
      const existingValues: Record<string, Primitive> = {};
      for (const [k, v] of Object.entries(props)) {
        existingValues[k] = v ?? "";
      }
      setPropertyValues(existingValues);

      const found = components.find((c) => c.name === attrs.componentName);
      if (found) {
        setSelectedComponent(found);
      }
    }
  }, [existingComponent, components]);

  const handlePropertyChange = (propertyName: string, value: Primitive) => {
    setPropertyValues((prev) => ({
      ...prev,
      [propertyName]: value,
    }));
  };

  const validateRequiredFields = (): boolean => {
    if (!selectedComponent) {
      return false;
    }
    return selectedComponent.properties
      .filter((prop) => prop.required)
      .every((prop) => {
        const value = propertyValues[prop.name];
        return value !== undefined && value !== "" && value !== null;
      });
  };

  const handleInsertComponent = async (): Promise<void> => {
    if (!selectedComponent || !editor) {
      return;
    }

    if (!validateRequiredFields()) {
      console.warn("Please fill in all required fields");
      return;
    }

    const componentData: Record<string, Primitive> = {};
    for (const prop of selectedComponent.properties) {
      const raw = propertyValues[prop.name];
      if (raw !== undefined && raw !== "") {
        componentData[prop.name] =
          prop.type === "number" && typeof raw === "string"
            ? raw.trim() === ""
              ? ""
              : Number(raw)
            : raw;
      }
    }

    // Don't create instance here - will be created on post save
    const chain = editor.chain().focus();
    if (existingComponent && typeof getPos === "function") {
      const pos = getPos();
      chain.setTextSelection(pos);
    }

    chain
      .setCustomComponent({
        name: selectedComponent.name,
        technicalName: selectedComponent.technicalName,
        instanceId: undefined,
        attributes: componentData,
      })
      .run();

    handleClose();
  };

  const handleComponentSelect = (component: CustomComponent) => {
    setSelectedComponent(component);
    const initialValues: Record<string, Primitive> = {};
    for (const prop of component.properties) {
      initialValues[prop.name] =
        prop.defaultValue ?? getDefaultValueForType(prop.type);
    }
    setPropertyValues(initialValues);
  };

  const handleClose = (): void => {
    setIsOpen(false);
    setSelectedComponent(null);
    setPropertyValues({});
  };

  const renderPropertyInput = (property: ComponentProperty) => {
    const value: Primitive = propertyValues[property.name] ?? "";

    switch (property.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value === true}
              id={property.name}
              onCheckedChange={(checked) =>
                handlePropertyChange(property.name, checked === true)
              }
            />
            <Label htmlFor={property.name}>Enable {property.name}</Label>
          </div>
        );

      case "textarea":
        return (
          <Textarea
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            rows={3}
            value={String(value)}
          />
        );

      case "select":
        return (
          <VirtualizedSelect
            onValueChange={(newValue) =>
              handlePropertyChange(property.name, newValue)
            }
            options={property.options || []}
            placeholder={`Select ${property.name}`}
            value={String(value)}
          />
        );

      case "number":
        return (
          <Input
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            type="number"
            value={asNumberValue(value)}
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className={cn(
                  "justify-between bg-editor-field text-left font-normal shadow-none",
                  !value && "text-muted-foreground"
                )}
                variant="outline"
              >
                {value ? (
                  format(new Date(value as string), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarDotsIcon className="text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto overflow-hidden p-0">
              <Calendar
                autoFocus
                captionLayout="dropdown"
                mode="single"
                onSelect={(date: Date | undefined) => {
                  if (date) {
                    handlePropertyChange(property.name, date.toISOString());
                  }
                }}
                selected={value ? new Date(String(value)) : undefined}
              />
            </PopoverContent>
          </Popover>
        );

      case "email":
        return (
          <Input
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            type="email"
            value={String(value)}
          />
        );

      case "url":
        return (
          <Input
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            type="url"
            value={new URL(String(value)).toString()}
          />
        );

      default:
        return (
          <Input
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            value={String(value ?? "")}
          />
        );
    }
  };

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent
        className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {selectedComponent && (
              <Button
                className="mr-2 p-1"
                onClick={() => setSelectedComponent(null)}
                size="sm"
                variant="ghost"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
            )}
            {selectedComponent
              ? `${existingComponent ? "Edit" : "Configure"} ${selectedComponent.name}`
              : "Insert Component"}
          </DialogTitle>
          <DialogDescription>
            {selectedComponent
              ? `${existingComponent ? "Edit" : "Configure"} the properties for your component`
              : "Choose a component to insert into your content"}
          </DialogDescription>
        </DialogHeader>

        {selectedComponent ? (
          <div className="space-y-6">
            <div className="space-y-4">
              {selectedComponent.properties.map((property) => (
                <div className="space-y-2" key={property.id}>
                  <Label className="flex items-center">
                    {property.name}
                    {property.required && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                    <Badge className="ml-2 text-xs" variant="outline">
                      {property.type}
                    </Badge>
                  </Label>
                  {renderPropertyInput(property)}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setSelectedComponent(null)}
                variant="outline"
              >
                Back
              </Button>
              <Button
                disabled={!validateRequiredFields()}
                onClick={handleInsertComponent}
              >
                {existingComponent ? "Update Component" : "Insert Component"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : components.length === 0 ? (
              <div className="py-8 text-center">
                <PuzzlePieceIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No custom components found. Create some in the Components
                  section first.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {components.map((component) => (
                  <Card
                    className="cursor-pointer transition-colors hover:border-primary"
                    key={component.id}
                    onClick={() => handleComponentSelect(component)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center text-lg">
                        <PuzzlePieceIcon className="mr-2 h-5 w-5" />
                        {component.name}
                      </CardTitle>
                      {component.description && (
                        <p className="text-muted-foreground text-sm">
                          {component.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {component.properties.map((prop) => (
                          <Badge
                            className="text-xs"
                            key={prop.id}
                            variant="secondary"
                          >
                            {prop.name}: {prop.type}
                            {prop.required && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
