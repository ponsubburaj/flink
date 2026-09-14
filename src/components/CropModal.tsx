"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

type Area = { x: number; y: number; width: number; height: number };

function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = area.width;
      canvas.height = area.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.92);
    };
  });
}

export default function CropModal({
  imageSrc,
  onCancel,
  onCropDone,
}: {
  imageSrc: string;
  onCancel: () => void;
  onCropDone: (blob: Blob) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
    onCropDone(blob);
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="bg-black px-6 py-5 space-y-4">
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-flash"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 border border-white/25 text-white rounded-lg py-2.5 text-sm font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-flash to-signal text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Saving…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}