"use client";

import * as React from "react";
import { Grid3X3, ListOrdered, RotateCw, Loader2 } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { useRealtime } from "@/features/realtime/client";
import { CADASTROS_TOPIC } from "./topics";
import { loadCadastrosData } from "./actions";
import type { MatrixChannelHeader, MatrixRow, PriorityItem } from "./types";
import { MatrixView } from "./matrix/matrix-view";
import { PrioritiesView } from "./priorities/priorities-view";

type ViewMode = "matriz" | "prioridades";

export function CadastrosTab() {
  const [mode, setMode] = React.useState<ViewMode>("matriz");
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const [channels, setChannels] = React.useState<MatrixChannelHeader[]>([]);
  const [matrix, setMatrix] = React.useState<MatrixRow[]>([]);
  const [priorities, setPriorities] = React.useState<PriorityItem[]>([]);

  const loadData = React.useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      try {
        const data = await loadCadastrosData(showCompleted);
        setChannels(data.channels);
        setMatrix(data.matrix);
        setPriorities(data.priorities);
      } catch (err) {
        console.error("Failed to load cadastros data:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showCompleted]
  );

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  useRealtime(CADASTROS_TOPIC, () => {
    loadData();
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line-subtle bg-surface px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold text-ink">Cadastros</h1>
          <SegmentedControl
            label="Visualização de Cadastros"
            value={mode}
            onChange={(val) => setMode(val as ViewMode)}
            options={[
              {
                value: "matriz",
                label: "Matriz Geral",
                icon: <Grid3X3 className="size-3.5" />,
              },
              {
                value: "prioridades",
                label: "Fila de Prioridades",
                icon: <ListOrdered className="size-3.5" />,
              },
            ]}
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Show completed switch */}
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <Switch
              label="Mostrar propriedades finalizadas"
              checked={showCompleted}
              onChange={setShowCompleted}
            />
            <span className="hidden sm:inline">Mostrar finalizados</span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            disabled={refreshing || loading}
            onClick={() => loadData(true)}
            className="inline-flex size-8 items-center justify-center rounded-lg border border-line-subtle text-ink-secondary hover:bg-surface-hover hover:text-ink disabled:opacity-40 transition-colors"
            title="Atualizar dados"
          >
            <RotateCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-ink-muted" />
          </div>
        ) : mode === "matriz" ? (
          <MatrixView
            channels={channels}
            matrix={matrix}
            searchQuery=""
            showCompleted={showCompleted}
            onRefresh={() => loadData()}
          />
        ) : (
          <PrioritiesView
            priorities={priorities}
            searchQuery=""
            onRefresh={() => loadData()}
          />
        )}
      </div>
    </div>
  );
}
