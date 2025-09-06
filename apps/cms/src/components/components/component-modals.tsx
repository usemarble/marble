"use client";

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
import type { CustomComponent } from "@/app/(main)/[workspace]/(workspace)/components/page-client";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { QUERY_KEYS } from "@/lib/queries/keys";

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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    properties: [] as any[],
  });

  const { mutate: createComponent, isPending: isCreating } = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/custom-components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        error instanceof Error ? error.message : "Failed to create component",
      );
    },
  });

  const { mutate: updateComponent, isPending: isUpdating } = useMutation({
    mutationFn: async (data: any) => {
      if (!editingComponent) throw new Error("No component to update");
      const response = await fetch(
        `/api/custom-components/${editingComponent.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
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
        error instanceof Error ? error.message : "Failed to update component",
      );
    },
  });

  useEffect(() => {
    if (editingComponent) {
      setFormData({
        name: editingComponent.name,
        description: editingComponent.description || "",
        properties: editingComponent.properties.map((prop) => ({
          name: prop.name,
          type: prop.type,
          required: prop.required,
          defaultValue: prop.defaultValue || "",
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
    setFormData((prev) => ({
      ...prev,
      properties: [
        ...prev.properties,
        { name: "", type: "string", required: false, defaultValue: "" },
      ],
    }));
  };

  const removeProperty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index),
    }));
  };

  const updateProperty = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.map((prop, i) =>
        i === index ? { ...prop, [field]: value } : prop,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Component Name</Label>
            {/** biome-ignore lint/correctness/useUniqueElementIds: <> */}
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Button, Card, Hero Section"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Brief description of the component"
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Properties</Label>
              <Button
                type="button"
                onClick={addProperty}
                size="sm"
                variant="outline"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </div>

            {formData.properties.map((property, index) => (
              <div
                key={`property-${property.name || index}`}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Property {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removeProperty(index)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Property Name</Label>
                    <Input
                      value={property.name}
                      onChange={(e) =>
                        updateProperty(index, "name", e.target.value)
                      }
                      placeholder="e.g. title, color, size"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={property.type}
                      onValueChange={(value) =>
                        updateProperty(index, "type", value)
                      }
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
                      value={property.defaultValue}
                      onChange={(e) =>
                        updateProperty(index, "defaultValue", e.target.value)
                      }
                      placeholder="Optional default value"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id={`required-${index}`}
                      checked={property.required}
                      onCheckedChange={(checked) =>
                        updateProperty(index, "required", checked)
                      }
                    />
                    <Label htmlFor={`required-${index}`}>Required</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isUpdating || !formData.name.trim()}
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
