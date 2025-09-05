"use client";

import { Button } from "@marble/ui/components/button";
import { Plus } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { ComponentModals } from "@/components/components/component-modals";
import { ComponentsDataTable } from "@/components/components/data-table";
import { useWorkspace } from "@/hooks/use-workspace-id";

export interface CustomComponent {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  properties: ComponentProperty[];
}

export interface ComponentProperty {
  id: string;
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}

export interface CreateComponentData {
  name: string;
  description?: string;
  properties?: Omit<ComponentProperty, 'id'>[];
}

export function PageClient(_props: { workspaceSlug: string }) {
  const [components, setComponents] = useState<CustomComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const workspaceId = useWorkspace();

  const fetchComponents = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/custom-components?workspaceId=${workspaceId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setComponents(data);
      }
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const handleCreate = async (componentData: CreateComponentData) => {
    try {
      const response = await fetch("/api/custom-components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...componentData,
          workspaceId,
        }),
      });

      if (response.ok) {
        await fetchComponents();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error("Failed to create component:", error);
    }
  };

  const handleUpdate = async (id: string, componentData: CreateComponentData) => {
    try {
      const response = await fetch(`/api/custom-components/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(componentData),
      });

      if (response.ok) {
        await fetchComponents();
      }
    } catch (error) {
      console.error("Failed to update component:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/custom-components/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchComponents();
      }
    } catch (error) {
      console.error("Failed to delete component:", error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Custom Components</h1>
          <p className="text-muted-foreground">
            Create and manage custom components for your content.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Component
        </Button>
      </div>

      <ComponentsDataTable
        data={components}
        isLoading={isLoading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      <ComponentModals
        showCreateModal={showCreateModal}
        onCreateClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
