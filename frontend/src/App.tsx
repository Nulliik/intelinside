import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Home from '@/pages/Home'
import Models from '@/pages/Models'
import Board from '@/pages/Board'
import Hardware from '@/pages/Hardware'
import HardwareDetail from '@/pages/HardwareDetail'
import BuildDetail from '@/pages/BuildDetail'
import BuildEditor from '@/pages/BuildEditor'
import Runtimes from '@/pages/Runtimes'
import RuntimeDetail from '@/pages/RuntimeDetail'
import Rigs from '@/pages/Rigs'
import RigDetail from '@/pages/RigDetail'
import ResultDetail from '@/pages/ResultDetail'
import Profile from '@/pages/Profile'
import SubmitResult from '@/pages/SubmitResult'
import RigEditor from '@/pages/RigEditor'
import AuthCallback from '@/pages/AuthCallback'
import { About, Guidelines, NotFound } from '@/pages/Static'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/models" element={<Models />} />
        <Route path="/models/:modelId" element={<Board />} />
        <Route path="/models/:modelId/:quant" element={<Board />} />
        <Route path="/hardware" element={<Hardware />} />
        <Route path="/hardware/:hardwareId" element={<HardwareDetail />} />
        <Route path="/runtimes" element={<Runtimes />} />
        <Route path="/runtimes/builds/new" element={<BuildEditor />} />
        <Route path="/runtimes/:runtimeId" element={<RuntimeDetail />} />
        <Route path="/runtimes/:runtimeId/builds/new" element={<BuildEditor />} />
        <Route path="/runtimes/:runtimeId/builds/:buildId" element={<BuildDetail />} />
        <Route path="/runtimes/:runtimeId/builds/:buildId/edit" element={<BuildEditor />} />
        <Route path="/rigs" element={<Rigs />} />
        <Route path="/rigs/new" element={<RigEditor />} />
        <Route path="/rigs/:rigId" element={<RigDetail />} />
        <Route path="/rigs/:rigId/edit" element={<RigEditor />} />
        <Route path="/results/:resultId" element={<ResultDetail />} />
        <Route path="/results/:resultId/edit" element={<SubmitResult mode="edit" />} />
        <Route path="/submit" element={<SubmitResult />} />
        <Route path="/u/:handle" element={<Profile />} />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
