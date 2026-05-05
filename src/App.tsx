import PetWindow from "./windows/PetWindow";
import ChatWindow from "./windows/ChatWindow";
import SettingsWindow from "./windows/SettingsWindow";

function App() {
  const hash = window.location.hash;

  if (hash === "#/chat") return <ChatWindow />;
  if (hash === "#/settings") return <SettingsWindow />;
  return <PetWindow />;
}

export default App;
