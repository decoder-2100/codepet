import { usePetStore } from "../stores/petStore";
import { Sound } from "../utils/sound";
import { getCrushAscii } from "../canvas/ascii";

const BugDropZone = () => {
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("active");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only remove if actually leaving the zone (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove("active");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("active");

    // Read from clipboard or data transfer
    let errorText = "";
    try {
      errorText = await navigator.clipboard.readText();
    } catch {
      errorText = e.dataTransfer.getData("text") || "Unknown error";
    }

    Sound.crush();

    // Try AI analysis first, fallback to static
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const analysis = await invoke<string>("crush_bug", { errorText });
      usePetStore.getState().setPose("crushing");
      usePetStore.getState().setAnim("crushing");
      setTimeout(() => {
        usePetStore.getState().showBubble(analysis, 6000);
        usePetStore.getState().setPose("happy");
        usePetStore.getState().setAnim("happy");
      }, 1000);
    } catch {
      // Fallback
      usePetStore.getState().setPose("crushing");
      usePetStore.getState().setAnim("crushing");
      setTimeout(() => {
        usePetStore.getState().showBubble(getCrushAscii(errorText), 6000);
        usePetStore.getState().setPose("happy");
        usePetStore.getState().setAnim("happy");
      }, 1000);
    }
  };

  return (
    <div
      id="bug-drop-zone"
      className="bug-drop-zone"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    />
  );
};

export default BugDropZone;
