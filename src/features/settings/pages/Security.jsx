import { useState, useEffect, useCallback } from "react";
import PageHeader from "../../../components/layout/PageHeader";
import Badge from "../../../components/common/Badge";
import ChangePasswordForm from "../components/ChangePasswordForm";
import Button from "@/components/common/Button";
import { apiClient } from "../../../services/apiClient";
import Loader from "../../../components/common/Loader";

export default function Security() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  const loadSessions = useCallback(async () => {
    try {
      const res = await apiClient.get('/auth/sessions');
      const items = res?.data ?? (Array.isArray(res) ? res : []);
      setSessions(items);
    } catch (e) {
      // Non-critical session failure fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (id) => {
    setRevoking(id);
    try {
      await apiClient.delete(`/auth/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeOthers = async () => {
    setRevoking('others');
    try {
      await apiClient.delete('/auth/sessions');
      setSessions((prev) => prev.filter((s) => s.current));
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Security"
        description="Password, sessions and two-factor authentication."
        breadcrumbs={[{ label: "Settings" }, { label: "Security" }]}
      />

      <ChangePasswordForm />

      <div className="card stack" style={{ maxWidth: 560 }}>
        <div className="row between">
          <p className="card__title" style={{ margin: 0 }}>Active sessions</p>
          {sessions.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRevokeOthers}
              disabled={revoking !== null}
            >
              Revoke other sessions
            </Button>
          )}
        </div>

        {loading ? (
          <Loader label="Loading active sessions..." />
        ) : sessions.length === 0 ? (
          <p className="muted small">No other active sessions detected.</p>
        ) : (
          sessions.map((session) => (
            <div className="row between" key={session.id || session.device}>
              <div>
                <p className="strong">{session.device || "Browser Session"}</p>
                <p className="muted small">{session.location || session.ip || "Secure Session"}</p>
              </div>
              {session.current ? (
                <Badge tone="success">This device</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRevoke(session.id)}
                  disabled={revoking === session.id}
                >
                  {revoking === session.id ? "Revoking..." : "Revoke"}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
