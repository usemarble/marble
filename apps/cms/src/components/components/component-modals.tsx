"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@marble/ui/components/alert-dialog";
import { Button } from "@marble/ui/components/button";
import { Checkbox } from "@marble/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { MAX_COMPONENT_PROPERTIES } from "@/lib/constants";
import { QUERY_KEYS } from "@/lib/queries/keys";
import type { CustomComponent } from "./columns";

interface ComponentProperty {
  id: string;
  name: string;
  type: string;
  required: boolean;
  defaultValue: string;
  options?: Array<{ label: string; value: string }>;
}

interface ComponentFormData {
  name: string;
  description: string;
  properties: ComponentProperty[];
}

interface ComponentModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode?: "create" | "update";
  editingComponent?: CustomComponent | null;
}

const PROPERTY_TYPES = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "email", label: "Email" },
  { value: "url", label: "URL" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
];

export function ComponentModal({
  open,
  setOpen,
  mode = "create",
  editingComponent,
}: ComponentModalProps) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();
  const [formData, setFormData] = useState<ComponentFormData>({
    name: "",
    description: "",
    properties: [],
  });

  const { mutate: createComponent, isPending: isCreating } = useMutation({
    mutationFn: async (data: ComponentFormData) => {
      const response = await fetch("/api/custom-components", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          workspaceId,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create component");
      }
      return response.json();
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Component created successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_COMPONENTS(workspaceId),
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create component"
      );
    },
  });

  const { mutate: updateComponent, isPending: isUpdating } = useMutation({
    mutationFn: async (data: ComponentFormData) => {
      if (!editingComponent) throw new Error("No component to update");
      const response = await fetch(
        `/api/custom-components/${editingComponent.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update component");
      }
      return response.json();
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Component updated successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_COMPONENTS(workspaceId),
        });
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update component"
      );
    },
  });

  useEffect(() => {
    if (editingComponent) {
      setFormData({
        name: editingComponent.name,
        description: editingComponent.description || "",
        properties: editingComponent.properties.map((prop) => ({
          id: prop.id ?? crypto.randomUUID(),
          name: prop.name,
          type: prop.type,
          required: prop.required,
          defaultValue: prop.defaultValue || "",
          options: prop.options || [],
        })),
      });
    } else {
      setFormData({
        name: "",
        description: "",
        properties: [],
      });
    }
  }, [editingComponent]);

  const addProperty = () => {
    if (formData.properties.length >= MAX_COMPONENT_PROPERTIES) {
      toast.error(`Maximum of ${MAX_COMPONENT_PROPERTIES} properties allowed`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      properties: [
        ...prev.properties,
        {
          id: crypto.randomUUID(),
          name: "",
          type: "string",
          required: false,
          defaultValue: "",
          options: [],
        },
      ],
    }));
  };

  const removeProperty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index),
    }));
  };

  const updateProperty = (
    index: number,
    field: keyof ComponentProperty,
    value: string | boolean | Array<{ label: string; value: string }>
  ) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.map((prop, i) =>
        i === index ? { ...prop, [field]: value } : prop
      ),
    }));
  };

  const addSelectOption = (propertyIndex: number) => {
    const property = formData.properties[propertyIndex];
    if (!property) return;
    const newOptions = [...(property.options || []), { label: "", value: "" }];
    updateProperty(propertyIndex, "options", newOptions);
  };

  const removeSelectOption = (propertyIndex: number, optionIndex: number) => {
    const property = formData.properties[propertyIndex];
    if (!property) return;
    const newOptions = (property.options || []).filter(
      (_, i) => i !== optionIndex
    );
    updateProperty(propertyIndex, "options", newOptions);
  };

  const updateSelectOption = (
    propertyIndex: number,
    optionIndex: number,
    field: "label" | "value",
    value: string
  ) => {
    const property = formData.properties[propertyIndex];
    if (!property) return;
    const newOptions = (property.options || []).map((option, i) =>
      i === optionIndex ? { ...option, [field]: value } : option
    );
    updateProperty(propertyIndex, "options", newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!formData.name.trim()) return;

    if (mode === "update") {
      updateComponent(formData);
    } else {
      createComponent(formData);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      name: "",
      description: "",
      properties: [],
    });
  };

  const title = mode === "update" ? "Edit Component" : "Create Component";
  const description =
    mode === "update"
      ? "Update your custom component configuration."
      : "Create a new custom component for your content.";

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Component Name</Label>
            <Input
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Button, Card, Hero Section"
              required
              value={formData.name}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief description of the component"
              rows={3}
              value={formData.description}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>
                Properties ({formData.properties.length}/
                {MAX_COMPONENT_PROPERTIES})
              </Label>
              <Button
                disabled={
                  formData.properties.length >= MAX_COMPONENT_PROPERTIES
                }
                onClick={addProperty}
                size="sm"
                type="button"
                variant="outline"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </div>

            {formData.properties.map((property, index) => (
              <div
                className="space-y-3 rounded-lg border p-4"
                key={`${property.id}`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Property {index + 1}</h4>
                  <Button
                    className="text-destructive"
                    onClick={() => removeProperty(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Property Name</Label>
                    <Input
                      onChange={(e) =>
                        updateProperty(index, "name", e.target.value)
                      }
                      placeholder="e.g. title, color, size"
                      required
                      value={property.name}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      onValueChange={(value) => {
                        updateProperty(index, "type", value);
                        if (value !== "select") {
                          updateProperty(index, "options", []);
                        }
                      }}
                      value={property.type}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Default Value</Label>
                    <Input
                      onChange={(e) =>
                        updateProperty(index, "defaultValue", e.target.value)
                      }
                      placeholder="Optional default value"
                      value={property.defaultValue}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      checked={property.required}
                      id={`required-${index}`}
                      onCheckedChange={(checked) =>
                        updateProperty(index, "required", checked)
                      }
                    />
                    <Label htmlFor={`required-${index}`}>Required</Label>
                  </div>
                </div>

                {property.type === "select" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button
                        onClick={() => addSelectOption(index)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <PlusIcon className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                    </div>

                    {(property.options || []).map((option, optionIndex) => (
                      <div
                        className="grid grid-cols-2 items-end gap-3"
                        key={`${property.id}-option-${optionIndex}`}
                      >
                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            onChange={(e) =>
                              updateSelectOption(
                                index,
                                optionIndex,
                                "label",
                                e.target.value
                              )
                            }
                            placeholder="Display text"
                            required
                            value={option.label}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Value</Label>
                          <div className="flex space-x-2">
                            <Input
                              onChange={(e) =>
                                updateSelectOption(
                                  index,
                                  optionIndex,
                                  "value",
                                  e.target.value
                                )
                              }
                              placeholder="Stored value"
                              required
                              value={option.value}
                            />
                            <Button
                              className="px-2 text-destructive"
                              onClick={() =>
                                removeSelectOption(index, optionIndex)
                              }
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!property.options || property.options.length === 0) && (
                      <p className="text-muted-foreground text-sm">
                        No options added yet. Click "Add Option" to create
                        select options.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={handleClose} type="button" variant="outline">
              Cancel
            </Button>
            <Button
              disabled={isCreating || isUpdating || !formData.name.trim()}
              type="submit"
            >
              {isCreating || isUpdating
                ? "Saving..."
                : mode === "update"
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteComponentModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  component: {
    id: string;
    name: string;
  };
}

export function DeleteComponentModal({
  open,
  setOpen,
  component,
}: DeleteComponentModalProps) {
  const queryClient = useQueryClient();
  const workspaceId = useWorkspaceId();

  const { mutate: deleteComponent, isPending } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/custom-components/${component.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete component");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Component deleted successfully");
      if (workspaceId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CUSTOM_COMPONENTS(workspaceId),
        });
      }
      setOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete component"
      );
    },
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Component</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{component.name}"? This action
            cannot be undone and will permanently remove the component and all
            its properties.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
            onClick={() => deleteComponent()}
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
