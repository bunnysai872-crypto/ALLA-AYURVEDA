import ResearcherWorkspace from "./frontend3/ResearcherWorkspace";
import IECSecretariatWorkspace from "./frontend3/IECSecretariatWorkspace";
import IECMemberWorkspace from "./frontend3/IECMemberWorkspace";
import IECDecisionPage from "./frontend3/pages/IECDecisionPage";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import UserLogin from "./pages/UserLogin";
import RegulatoryAdminWorkspace from "./pages/RegulatoryAdminWorkspace";


function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/user-login/:role"
          element={<UserLogin />}
        />
        <Route path="/researcher-workspace" element={<ResearcherWorkspace />} />
        <Route path="/iec-secretariat-workspace" element={<IECSecretariatWorkspace />} />
        <Route path="/iec-secretariat/dashboard" element={<IECSecretariatWorkspace initialTab="dashboard" />} />
        <Route path="/iec-secretariat/studies" element={<IECSecretariatWorkspace initialTab="submissions" />} />
        <Route path="/iec-secretariat/studies/:studyId" element={<IECSecretariatWorkspace initialTab="study-review" />} />
        <Route path="/iec-secretariat/studies/:studyId/documents" element={<IECSecretariatWorkspace initialTab="document-verification" />} />
        <Route path="/iec-member-workspace" element={<IECMemberWorkspace />} />
        <Route path="/iec-decision/:studyId" element={<IECDecisionPage />} />
        <Route path="/regulatory-admin-workspace" element={<RegulatoryAdminWorkspace />} />

      </Routes>

    </BrowserRouter>
  );
}


export default App;