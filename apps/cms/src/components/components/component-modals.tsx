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
import { Plus, TrashIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type {
  CreateComponentData,
  CustomComponent,
} from "@/app/(main)/[workspace]/(workspace)/components/page-client";

interface ComponentModalsProps {
  showCreateModal?: boolean;
  showEditModal?: boolean;
  onCreateClose?: () => void;
  onEditClose?: () => void;
  onCreate?: (data: CreateComponentData) => Promise<void>;
  onEdit?: (data: CreateComponentData) => Promise<void>;
  editingComponent?: CustomComponent | null;
}

interface FormPropertyData {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
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

export function ComponentModals({
  showCreateModal = false,
  showEditModal = false,
  onCreateClose,
  onEditClose,
  onCreate,
  onEdit,
  editingComponent,
}: ComponentModalsProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    properties: [] as FormPropertyData[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const updateProperty = (index: number, field: keyof FormPropertyData, value: string | boolean) => {
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

    setIsSubmitting(true);
    try {
      if (editingComponent && onEdit) {
        await onEdit(formData);
      } else if (onCreate) {
        await onCreate(formData);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (editingComponent && onEditClose) {
      onEditClose();
    } else if (onCreateClose) {
      onCreateClose();
    }
    setFormData({
      name: "",
      description: "",
      properties: [],
    });
  };

  const isOpen = showCreateModal || showEditModal;
  const title = editingComponent ? "Edit Component" : "Create Component";
  const description = editingComponent
    ? "Update your custom component configuration."
    : "Create a new custom component for your content.";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Component Name</Label>
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
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </div>

            {formData.properties.map((property, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
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
                      id={`required-${editingComponent?.id || 'new'}-${index}`}
                      checked={property.required}
                      onCheckedChange={(checked) =>
                        updateProperty(index, "required", checked)
                      }
                    />
                    <Label htmlFor={`required-${editingComponent?.id || 'new'}-${index}`}>Required</Label>
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
              disabled={isSubmitting || !formData.name.trim()}
            >
              {isSubmitting
                ? "Saving..."
                : editingComponent
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
