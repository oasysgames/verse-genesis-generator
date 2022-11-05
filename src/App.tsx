import { Box } from "@mantine/core";
import "./App.css";
import GenesisForm from "./form";

export default function App() {
  const download = (content: object, filename: string) => {
    const blob = new Blob([JSON.stringify(content, null, 4)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    a.remove();
  };

  return (
    <Box className="App">
      <Box className="form-wrap">
        <GenesisForm
          onGenerated={({ addresses, genesis }) => {
            download(addresses, "addresses.json");
            download(genesis, "genesis.json");
          }}
        />
      </Box>
      <footer className="footer">
        Copyright © 2022 Oasys | Blockchain for Games All Rights Reserved.
      </footer>
    </Box>
  );
}
