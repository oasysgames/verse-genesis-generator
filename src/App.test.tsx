import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders copyright", () => {
  render(<App />);
  const linkElement = screen.getByText(/Oasys/);
  expect(linkElement).toBeInTheDocument();
});
