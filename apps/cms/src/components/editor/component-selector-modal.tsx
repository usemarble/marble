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
import { useCallback, useEffect, useState } from "react";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import type { ComponentProperty, CustomComponent } from "../components/columns";
import { LoadingSpinner } from "../ui/async-button";

export function ComponentEditorModal({
  isOpen,
  setIsOpen,
  editor,
  existingComponent,
}: ComponentSelectorModalProps) {
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({});
  const workspaceId = useWorkspaceId();

  const { data: components = [] } = useQuery({
    queryKey: ["custom-components", workspaceId],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const response = await fetch("/api/custom-components");
      if (!response.ok) {
        throw new Error("Failed to fetch components");
      }
      return response.json();
    },
    enabled: !!workspaceId,
  });

  // Find the component definition for the existing component
  const componentDef =
    existingComponent && components.length > 0
      ? components.find(
          (c: CustomComponent) =>
            c.name === existingComponent.attrs.componentName,
        )
      : null;

  useEffect(() => {
    if (existingComponent && componentDef) {
      const existingValues: Record<string, any> = {};
      const properties = existingComponent.attrs.properties || {};

      Object.entries(properties).forEach(([key, value]) => {
        existingValues[key] = value;
      });
      setPropertyValues(existingValues);
    }
  }, [existingComponent, componentDef]);

  const handlePropertyChange = (propertyName: string, value: any) => {
    setPropertyValues((prev) => ({
      ...prev,
      [propertyName]: value,
    }));
  };

  // Validate required fields for editing
  const validateEditFields = () => {
    if (!componentDef) return false;

    return componentDef.properties
      .filter((prop: ComponentProperty) => prop.required)
      .every((prop: ComponentProperty) => {
        const value = propertyValues[prop.name];
        return value !== undefined && value !== "" && value !== null;
      });
  };

  const handleUpdateComponent = () => {
    if (!componentDef || !editor || !existingComponent) return;

    // Check if all required fields are filled
    if (!validateEditFields()) {
      console.warn("Please fill in all required fields");
      return;
    }

    const componentData: Record<string, any> = {};
    componentDef.properties.forEach((prop: ComponentProperty) => {
      const value = propertyValues[prop.name];
      if (value !== undefined && value !== "") {
        componentData[prop.name] = value;
      }
    });

    const pos = editor.view.posAtDOM(existingComponent.dom);
    if (pos !== undefined) {
      editor
        .chain()
        .focus()
        .setTextSelection(pos)
        .setCustomComponent({
          name: componentDef.name,
          attributes: componentData,
        })
        .run();
    }

    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setPropertyValues({});
  };

  const renderPropertyInput = (property: ComponentProperty) => {
    const value = propertyValues[property.name] ?? "";

    switch (property.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={property.name}
              checked={value}
              onCheckedChange={(checked) =>
                handlePropertyChange(property.name, checked)
              }
            />
            <Label htmlFor={property.name}>Enable {property.name}</Label>
          </div>
        );

      case "textarea":
        return (
          <Textarea
            value={value}
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
            value={value}
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
            value={value}
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
            value={value}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={value}
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
            value={value}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );

      default:
        return (
          <Input
            value={value}
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
      existingComponent?.attrs?.componentName,
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
            {componentDef.properties.map((property: ComponentProperty) => (
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
  editor?: any;
  existingComponent?: any;
}

export function ComponentSelectorModal({
  isOpen,
  setIsOpen,
  editor,
  existingComponent,
}: ComponentSelectorModalProps) {
  const [selectedComponent, setSelectedComponent] =
    useState<CustomComponent | null>(null);
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({});
  const workspaceId = useWorkspaceId();

  const { data: components = [], isLoading } = useQuery({
    queryKey: ["custom-components", workspaceId],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const response = await fetch("/api/custom-components");
      if (!response.ok) {
        throw new Error("Failed to fetch components");
      }
      return response.json();
    },
    enabled: !!workspaceId,
  });

  const getDefaultValueForType = useCallback((type: string) => {
    switch (type) {
      case "boolean":
        return false;
      case "number":
        return "";
      case "date":
        return new Date().toISOString().split("T")[0];
      default:
        return "";
    }
  }, []);

  useEffect(() => {
    if (existingComponent && components.length > 0) {
      const existingValues: Record<string, any> = {};
      const properties = existingComponent.attrs.properties || {};

      Object.entries(properties).forEach(([key, value]) => {
        existingValues[key] = value;
      });
      setPropertyValues(existingValues);

      const componentDef = components.find(
        (c: CustomComponent) =>
          c.name === existingComponent.attrs.componentName,
      );
      if (componentDef) {
        setSelectedComponent(componentDef);
      }
    }
  }, [existingComponent, components]);

  const handlePropertyChange = (propertyName: string, value: any) => {
    setPropertyValues((prev) => ({
      ...prev,
      [propertyName]: value,
    }));
  };

  // Validate required fields
  const validateRequiredFields = () => {
    if (!selectedComponent) return false;

    return selectedComponent.properties
      .filter((prop) => prop.required)
      .every((prop) => {
        const value = propertyValues[prop.name];
        return value !== undefined && value !== "" && value !== null;
      });
  };

  const handleInsertComponent = () => {
    if (!selectedComponent || !editor) return;

    // Check if all required fields are filled
    if (!validateRequiredFields()) {
      // You could add a toast notification here
      console.warn("Please fill in all required fields");
      return;
    }

    const componentData: Record<string, any> = {};
    selectedComponent.properties.forEach((prop) => {
      const value = propertyValues[prop.name];
      if (value !== undefined && value !== "") {
        componentData[prop.name] = value;
      }
    });

    if (existingComponent) {
      const pos = editor.view.posAtDOM(existingComponent.dom);
      if (pos !== undefined) {
        editor
          .chain()
          .focus()
          .setTextSelection(pos)
          .setCustomComponent({
            name: selectedComponent.name,
            attributes: componentData,
          })
          .run();
      }
    } else {
      editor
        .chain()
        .focus()
        .setCustomComponent({
          name: selectedComponent.name,
          attributes: componentData,
        })
        .run();
    }

    handleClose();
  };

  const handleComponentSelect = (component: CustomComponent) => {
    setSelectedComponent(component);
    const initialValues: Record<string, any> = {};
    component.properties.forEach((prop) => {
      initialValues[prop.name] =
        prop.defaultValue || getDefaultValueForType(prop.type);
    });
    setPropertyValues(initialValues);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedComponent(null);
    setPropertyValues({});
  };

  const renderPropertyInput = (property: ComponentProperty) => {
    const value = propertyValues[property.name] ?? "";

    switch (property.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={property.name}
              checked={value}
              onCheckedChange={(checked) =>
                handlePropertyChange(property.name, checked)
              }
            />
            <Label htmlFor={property.name}>Enable {property.name}</Label>
          </div>
        );

      case "textarea":
        return (
          <Textarea
            value={value}
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
            value={value}
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
            value={value}
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
            value={value}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
          />
        );

      case "email":
        return (
          <Input
            type="email"
            value={value}
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
            value={value}
            onChange={(e) =>
              handlePropertyChange(property.name, e.target.value)
            }
            placeholder={`Enter ${property.name}`}
          />
        );

      default:
        return (
          <Input
            value={value}
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
                {components.map((component: CustomComponent) => (
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
                        {component.properties.map((prop: ComponentProperty) => (
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
