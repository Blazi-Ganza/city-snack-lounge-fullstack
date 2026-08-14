import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CartDrawer } from "./components/CartDrawer";
import { ChatWidget } from "./components/ChatWidget";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { BranchProvider } from "./context/BranchContext";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import { PortalAuthProvider, type PortalRole, usePortalAuth } from "./context/PortalAuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { type BranchId } from "./data";
import { BranchSelectionPage } from "./pages/BranchSelectionPage";
import { ChatPage } from "./pages/ChatPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { MenuPage } from "./pages/MenuPage";
import { AdminDashboardPage } from "./pages/portal/AdminDashboardPage";
import { PortalLoginPage } from "./pages/portal/PortalLoginPage";
import { ReceptionDashboardPage } from "./pages/portal/ReceptionDashboardPage";
import { ReservationPage } from "./pages/ReservationPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { BranchDetailPage } from "./pages/admin/BranchDetailPage";
import { SettingsBranchesPage } from "./pages/admin/SettingsBranchesPage";
import { SettingsStaffPage } from "./pages/admin/SettingsStaffPage";
import { SettingsHoursPage } from "./pages/admin/SettingsHoursPage";
import { SettingsNotificationsPage } from "./pages/admin/SettingsNotificationsPage";
import { NotificationsProvider } from "./context/NotificationsContext";

function ProtectedPortalRoute({ role, children }: { role: PortalRole; children: ReactNode }) {
  const { session, validateSession } = usePortalAuth();

  // Fire-and-forget validation — if token is bad, validateSession will sign out
  // and the next render will catch !session. No blocking spinner needed.
  useEffect(() => {
    if (session && session.role === role) {
      validateSession().catch(() => {
        // Silent — validateSession already handles logout internally
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.token]);

  if (!session || session.role !== role) {
    return <Navigate to={role === "admin" ? "/admin/login" : "/reception/login"} replace />;
  }

  return <>{children}</>;
}

function BranchRoutes({ branchId }: { branchId: BranchId }) {
  const location = useLocation();

  return (
    <BranchProvider branch={branchId}>
      <CartProvider>
        <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
          <Navbar />
          <main className="pt-16">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route
                  index
                  element={
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <HomePage />
                    </motion.div>
                  }
                />
                <Route
                  path="menu"
                  element={
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <MenuPage />
                    </motion.div>
                  }
                />
                <Route
                  path="reservation"
                  element={
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <ReservationPage />
                    </motion.div>
                  }
                />
                <Route
                  path="reviews"
                  element={
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <ReviewsPage />
                    </motion.div>
                  }
                />
                <Route
                  path="contact"
                  element={
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <ContactPage />
                    </motion.div>
                  }
                />
                <Route
                  path="chat"
                  element={
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <ChatPage />
                    </motion.div>
                  }
                />
                <Route path="*" element={<Navigate to="" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
          <Footer />
          <ChatWidget key={branchId} />
          <CartDrawer />
        </div>
      </CartProvider>
    </BranchProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <PortalAuthProvider>
          <NotificationsProvider>
            <BrowserRouter>
              <Routes>
                {/* Public / Customer */}
                <Route path="/" element={<BranchSelectionPage />} />
                <Route path="/musanze/*" element={<BranchRoutes branchId="musanze" />} />
                <Route path="/huye/*" element={<BranchRoutes branchId="huye" />} />

                {/* Reception */}
                <Route path="/reception/login" element={<PortalLoginPage role="receptionist" />} />
                <Route
                  path="/reception/dashboard"
                  element={
                    <ProtectedPortalRoute role="receptionist">
                      <ReceptionDashboardPage />
                    </ProtectedPortalRoute>
                  }
                />

                {/* Admin */}
                <Route path="/admin/login" element={<PortalLoginPage role="admin" />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedPortalRoute role="admin">
                      <AdminDashboardPage />
                    </ProtectedPortalRoute>
                  }
                />
                <Route
                  path="/admin/settings/branches"
                  element={
                    <ProtectedPortalRoute role="admin">
                      <SettingsBranchesPage />
                    </ProtectedPortalRoute>
                  }
                />
                <Route
                  path="/admin/settings/staff"
                  element={
                    <ProtectedPortalRoute role="admin">
                      <SettingsStaffPage />
                    </ProtectedPortalRoute>
                  }
                />
                <Route
                  path="/admin/settings/hours"
                  element={
                    <ProtectedPortalRoute role="admin">
                      <SettingsHoursPage />
                    </ProtectedPortalRoute>
                  }
                />
                <Route
                  path="/admin/settings/notifications"
                  element={
                    <ProtectedPortalRoute role="admin">
                      <SettingsNotificationsPage />
                    </ProtectedPortalRoute>
                  }
                />
                <Route
                  path="/admin/branches/:branchId"
                  element={
                    <ProtectedPortalRoute role="admin">
                      <BranchDetailPage />
                    </ProtectedPortalRoute>
                  }
                />

                {/* Catch-all MUST be last */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </NotificationsProvider>
        </PortalAuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}