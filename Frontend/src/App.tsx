import { Route, Routes } from "react-router-dom";

function SetupPlaceholder() {
  return (
    <main className="min-h-screen bg-bg-base p-8 text-text-primary">
      <h1 className="text-2xl font-semibold">RecruitBot</h1>
      <p className="mt-2 text-text-muted">Frontend infrastructure is ready.</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<SetupPlaceholder />} />
    </Routes>
  );
}
