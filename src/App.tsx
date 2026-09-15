import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { IntakeProvider } from "./services/IntakeContext";
import Welcome from "./pages/Welcome";
import LanguagePage from "./pages/LanguagePage";
import ConsentPage from "./pages/ConsentPage";
import ABHAPage from "./pages/ABHAPage";
import PathwayPage from "./pages/PathwayPage";
import DemographicsPage from "./pages/DemographicsPage";
import Intake from "./pages/Intake";
import Review from "./pages/Review";
import Complete from "./pages/Complete";
import DoctorDashboard from "./pages/DoctorDashboard";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <IntakeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/language" element={<LanguagePage />} />
          <Route path="/mode" element={<Navigate to="/consent" replace />} />
          <Route path="/consent" element={<ConsentPage />} />
          <Route path="/abha" element={<ABHAPage />} />
          <Route path="/pathway" element={<PathwayPage />} />
          <Route path="/demographics" element={<DemographicsPage />} />
          <Route path="/intake" element={<Intake />} />
          <Route path="/review" element={<Review />} />
          <Route path="/complete" element={<Complete />} />
          <Route path="/doctor" element={<DoctorDashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </BrowserRouter>
    </IntakeProvider>
  );
}
