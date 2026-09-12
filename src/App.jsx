import React from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import Header from './components/Header';
import TripHazardBanner from './components/TripHazardBanner';
import FaultBench from './components/FaultBench';
import VibrationWidget from './components/widgets/VibrationWidget';
import AcousticWidget from './components/widgets/AcousticWidget';
import KinematicsWidget from './components/widgets/KinematicsWidget';
import ThermalCurrentWidget from './components/widgets/ThermalCurrentWidget';
import AiHealthMatrixWidget from './components/widgets/AiHealthMatrixWidget';
import EventLogSection from './components/EventLogSection';
import Modals from './components/Modals';

export default function App() {
  return (
    <TelemetryProvider>
      {/* Top Notification Banner / Trip Overlay */}
      <TripHazardBanner />

      {/* Main App Container */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 py-3 space-y-3">
        {/* Header & System Status Bar */}
        <Header />

        {/* Fault Injection & Test Bench Toolbar */}
        <FaultBench />

        {/* Core Telemetry & Diagnostic Widgets Grid */}
        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <VibrationWidget />
          <AcousticWidget />
          <KinematicsWidget />
          <ThermalCurrentWidget />
          <AiHealthMatrixWidget />
        </main>

        {/* Interactive Event Stream & Log Recorder */}
        <EventLogSection />
      </div>

      {/* Application Modals */}
      <Modals />
    </TelemetryProvider>
  );
}
