import PetWindow from "./windows/PetWindow";
import SettingsWindow from "./windows/SettingsWindow";

function App() {
  const hash = window.location.hash;

  if (hash === "#/settings") {
    return <SettingsWindow />;
  }

  return <PetWindow />;
}

export default App;
