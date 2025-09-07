"use client";

import { Badge } from "@marble/ui/components/badge";
import { Button } from "@marble/ui/components/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@marble/ui/components/select";
import { Textarea } from "@marble/ui/components/textarea";
import { ArrowLeftIcon, PuzzlePieceIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { ComponentProperty, CustomComponent } from "../components/columns";
import { LoadingSpinner } from "../ui/async-button";

type Primitive = string | number | boolean | null;

type NodeAttrs = {
  componentName?: string;
  properties?: Record<string, Primitive>;
};

type ExistingNode = { attrs?: NodeAttrs } | null;

// For number inputs: allow number or empty string
const asNumberValue = (v: Primitive): number | string =>
  typeof v === "number" ? v : typeof v === "string" ? v : "";

interface ComponentEditorModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editor: Editor;
  existingComponent: ExistingNode;
  getPos?: () => number;
}

export function ComponentEditorModal({
  isOpen,
  setIsOpen,
  editor,
  existingComponent,
  getPos,
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

  // Find the component definition for the existing component
  const componentDef =
    existingComponent && components.length > 0
      ? (components.find(
          (c) =>
            c.name ===
            ((existingComponent.attrs ?? {}) as NodeAttrs).componentName,
        ) ?? null)
      : null;

  useEffect(() => {
    if (existingComponent && componentDef) {
      const attrs = (existingComponent.attrs ?? {}) as NodeAttrs;
      const props = attrs.properties ?? {};
      const existingValues: Record<string, Primitive> = {};
      Object.entries(props).forEach(([key, value]) => {
        existingValues[key] = value ?? "";
      });
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
    if (!componentDef) return false;
    return componentDef.properties
      .filter((prop) => prop.required)
      .every((prop) => {
        const value = propertyValues[prop.name];
        return value !== undefined && value !== "" && value !== null;
      });
  };

  const handleUpdateComponent = (): void => {
    if (!componentDef || !editor) return;

    if (!validateEditFields()) {
      console.warn("Please fill in all required fields");
      return;
    }

    const componentData: Record<string, Primitive> = {};
    componentDef.properties.forEach((prop) => {
      const raw = propertyValues[prop.name];
      if (raw !== undefined && raw !== "") {
        componentData[prop.name] =
          prop.type === "number" && typeof raw === "string"
            ? raw.trim() === ""
              ? ""
              : Number(raw)
            : raw;
      }
    });

    const chain = editor.chain().focus();
    const pos = typeof getPos === "function" ? getPos() : null;
    if (typeof pos === "number") {
      chain.setTextSelection(pos);
    }

    chain
      .setCustomComponent({
        name: componentDef.name,
        attributes: componentData,
      })
      .run();

    handleClose();
  };

  const handleClose = (): void => {
    setIsOpen(false);
    setPropertyValues({});
  };

  const renderPropertyInput = (property: ComponentProperty) => {
    const value: Primitive = propertyValues[property.name] ?? "";

    switch (property.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={property.name}
              checked={value === true}
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
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            rows={3}
          />
        );

      case "select":
        return (
          <Select
            value={(value ?? "") as string}
            onValueChange={(newValue) =>
              handlePropertyChange(property.name, newValue)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${property.name}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            type="number"
            value={asNumberValue(value)}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );

      case "url":
        return (
          <Input
            type="url"
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );

      default:
        return (
          <Input
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );
    }
  };

  if (!componentDef) {
    console.warn(
      "ComponentEditorModal: Component definition not found for:",
      (existingComponent?.attrs as NodeAttrs | undefined)?.componentName,
    );
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
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
              <div key={property.id} className="space-y-2">
                <Label className="flex items-center">
                  {property.name}
                  {property.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  <Badge variant="outline" className="ml-2 text-xs">
                    {property.type}
                  </Badge>
                </Label>
                {renderPropertyInput(property)}
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateComponent}
              disabled={!validateEditFields()}
            >
              Update Component
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ComponentSelectorModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editor?: Editor;
  existingComponent?: ExistingNode;
  /** (optional) from NodeView; ensures selection targets this node */
  getPos?: () => number;
}

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
    [],
  );

  useEffect(() => {
    if (existingComponent && components.length > 0) {
      const attrs = (existingComponent.attrs ?? {}) as NodeAttrs;
      const props = attrs.properties ?? {};
      const existingValues: Record<string, Primitive> = {};
      Object.entries(props).forEach(([k, v]) => {
        existingValues[k] = v ?? "";
      });
      setPropertyValues(existingValues);

      const found = components.find((c) => c.name === attrs.componentName);
      if (found) setSelectedComponent(found);
    }
  }, [existingComponent, components]);

  const handlePropertyChange = (propertyName: string, value: Primitive) => {
    setPropertyValues((prev) => ({
      ...prev,
      [propertyName]: value,
    }));
  };

  // Validate required fields
  const validateRequiredFields = (): boolean => {
    if (!selectedComponent) return false;
    return selectedComponent.properties
      .filter((prop) => prop.required)
      .every((prop) => {
        const value = propertyValues[prop.name];
        return value !== undefined && value !== "" && value !== null;
      });
  };

  const handleInsertComponent = (): void => {
    if (!selectedComponent || !editor) return;

    if (!validateRequiredFields()) {
      console.warn("Please fill in all required fields");
      return;
    }

    const componentData: Record<string, Primitive> = {};
    selectedComponent.properties.forEach((prop) => {
      const raw = propertyValues[prop.name];
      if (raw !== undefined && raw !== "") {
        componentData[prop.name] =
          prop.type === "number" && typeof raw === "string"
            ? raw.trim() === ""
              ? ""
              : Number(raw)
            : raw;
      }
    });

    const chain = editor.chain().focus();
    if (existingComponent && typeof getPos === "function") {
      const pos = getPos();
      chain.setTextSelection(pos);
    }

    chain
      .setCustomComponent({
        name: selectedComponent.name,
        attributes: componentData,
      })
      .run();

    handleClose();
  };

  const handleComponentSelect = (component: CustomComponent) => {
    setSelectedComponent(component);
    const initialValues: Record<string, Primitive> = {};
    component.properties.forEach((prop) => {
      initialValues[prop.name] =
        prop.defaultValue ?? getDefaultValueForType(prop.type);
    });
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
              id={property.name}
              checked={value === true}
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
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
            rows={3}
          />
        );

      case "select":
        return (
          <Select
            value={(value ?? "") as string}
            onValueChange={(newValue) =>
              handlePropertyChange(property.name, newValue)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${property.name}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        );

      case "number":
        return (
          <Input
            type="number"
            value={asNumberValue(value)}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );

      case "url":
        return (
          <Input
            type="url"
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );

      default:
        return (
          <Input
            value={(value ?? "") as string}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {selectedComponent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedComponent(null)}
                className="mr-2 p-1"
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

        {!selectedComponent ? (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
              </div>
            ) : components.length === 0 ? (
              <div className="text-center py-8">
                <PuzzlePieceIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No custom components found. Create some in the Components
                  section first.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {components.map((component) => (
                  <Card
                    key={component.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleComponentSelect(component)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <PuzzlePieceIcon className="mr-2 h-5 w-5" />
                        {component.name}
                      </CardTitle>
                      {component.description && (
                        <p className="text-sm text-muted-foreground">
                          {component.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {component.properties.map((prop) => (
                          <Badge
                            key={prop.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {prop.name}: {prop.type}
                            {prop.required && (
                              <span className="text-red-500 ml-1">*</span>
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
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              {selectedComponent.properties.map((property) => (
                <div key={property.id} className="space-y-2">
                  <Label className="flex items-center">
                    {property.name}
                    {property.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {property.type}
                    </Badge>
                  </Label>
                  {renderPropertyInput(property)}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedComponent(null)}
              >
                Back
              </Button>
              <Button
                onClick={handleInsertComponent}
                disabled={!validateRequiredFields()}
              >
                {existingComponent ? "Update Component" : "Insert Component"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
