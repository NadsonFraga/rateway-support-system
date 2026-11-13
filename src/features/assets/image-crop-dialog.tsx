"use client";

import * as React from "react";
import { Check, RotateCw, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ImageCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  shape?: "quadrado" | "redondo";
  onClose: () => void;
  onConfirm: (croppedFile: File) => void;
};

const FRAME_SIZE = 260;
const OUTPUT_SIZE = 512;

export function ImageCropDialog({
  open,
  imageSrc,
  shape = "quadrado",
  onClose,
  onConfirm,
}: ImageCropDialogProps) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState(0);
  const [naturalSize, setNaturalSize] = React.useState<{ width: number; height: number } | null>(null);
  const [applying, setApplying] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const dragRef = React.useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);

  // Reset when dialog opens with a new image
  React.useEffect(() => {
    if (open) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setRotation(0);
      setApplying(false);
    }
  }, [open, imageSrc]);

  function onImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const img = event.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  }

  // Base scale so image covers the FRAME_SIZE
  const baseScale = React.useMemo(() => {
    if (!naturalSize) return 1;
    // Swap dimensions if rotated 90 or 270 deg
    const isRotatedSideways = rotation % 180 !== 0;
    const w = isRotatedSideways ? naturalSize.height : naturalSize.width;
    const h = isRotatedSideways ? naturalSize.width : naturalSize.height;
    return Math.max(FRAME_SIZE / w, FRAME_SIZE / h);
  }, [naturalSize, rotation]);

  // Pointer drag events for panning
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialPanX: pan.x,
      initialPanY: pan.y,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    setPan({
      x: dragRef.current.initialPanX + dx,
      y: dragRef.current.initialPanY + dy,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      dragRef.current = null;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture might have already been released
      }
    }
  }

  // Mouse wheel zoom
  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const delta = event.deltaY * -0.0015;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  }

  function handleReset() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }

  async function handleApply() {
    if (!naturalSize || !imgRef.current) return;
    setApplying(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Ratio between canvas resolution and onscreen frame
      const canvasRatio = OUTPUT_SIZE / FRAME_SIZE;

      // Center the canvas context
      ctx.translate(OUTPUT_SIZE / 2 + pan.x * canvasRatio, OUTPUT_SIZE / 2 + pan.y * canvasRatio);
      ctx.rotate((rotation * Math.PI) / 180);

      const drawWidth = naturalSize.width * baseScale * zoom * canvasRatio;
      const drawHeight = naturalSize.height * baseScale * zoom * canvasRatio;

      ctx.drawImage(imgRef.current, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

      // If round shape, we can keep the 1:1 square with centered crop, perfectly framing the circle
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const file = new File([blob], "imagem-ajustada.png", { type: "image/png" });
          onConfirm(file);
          onClose();
        },
        "image/png",
        0.95
      );
    } finally {
      setApplying(false);
    }
  }

  if (!open || !imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader
          title="Ajustar imagem"
          description={shape === "redondo" ? "Arraste e ajuste o zoom para enquadrar a foto no círculo." : "Arraste e ajuste o zoom para enquadrar a imagem."}
        />
        <DialogBody className="flex flex-col items-center gap-4 py-4">
          {/* Viewport Frame */}
          <div
            ref={containerRef}
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className="relative flex size-[280px] cursor-grab select-none items-center justify-center overflow-hidden rounded-xl bg-black/80 touch-none active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-line-focus"
            aria-label="Área de corte da imagem"
          >
            {/* The transformed image */}
            <div
              className="pointer-events-none absolute flex items-center justify-center transition-transform duration-75"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px)`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt=""
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                style={{
                  transform: `rotate(${rotation}deg) scale(${baseScale * zoom})`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                }}
                draggable={false}
              />
            </div>

            {/* Dark Mask with Crop Hole */}
            <div
              className={cn(
                "pointer-events-none absolute z-10 border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]",
                shape === "redondo" ? "rounded-full" : "rounded-2xl"
              )}
              style={{
                width: FRAME_SIZE,
                height: FRAME_SIZE,
              }}
            />
          </div>

          {/* Controls: Zoom slider & Rotate */}
          <div className="flex w-full flex-col gap-3 px-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                className="text-ink-secondary hover:text-ink"
                title="Reduzir zoom"
                aria-label="Reduzir zoom"
              >
                <ZoomOut className="size-4" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-surface-muted accent-ink"
                aria-label="Controle de zoom"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                className="text-ink-secondary hover:text-ink"
                title="Aumentar zoom"
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="size-4" />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-line-subtle pt-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                >
                  <RotateCw className="size-3.5" /> Girar 90°
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  title="Restaurar posição inicial"
                >
                  <Undo2 className="size-3.5" /> Redefinir
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={applying}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={() => void handleApply()} disabled={applying}>
                  <Check className="size-4" /> {applying ? "Processando..." : "Aplicar corte"}
                </Button>
              </div>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
