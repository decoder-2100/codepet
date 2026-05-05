import { getCurrentWindow } from "@tauri-apps/api/window";
import PetWindow from "./windows/PetWindow";
import ChatWindow from "./windows/ChatWindow";
import SettingsWindow from "./windows/SettingsWindow";

function App() {
  const label = getCurrentWindow().label;

  switch (label) {
    case "chat":
      return <ChatWindow />;
    case "settings":
      return <SettingsWindow />;
    default:
      return <PetWindow />;
  }
}

export default App;
