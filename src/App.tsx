import PetWindow from "./windows/PetWindow";
import ChatWindow from "./windows/ChatWindow";
import SettingsWindow from "./windows/SettingsWindow";

function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const windowType = searchParams.get("window");

  switch (windowType) {
    case "chat":
      return <ChatWindow />;
    case "settings":
      return <SettingsWindow />;
    default:
      return <PetWindow />;
  }
}

export default App;
