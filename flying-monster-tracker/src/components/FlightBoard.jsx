import React, { useState } from "react";
import { JOB_STATUSES, JOB_STATUS_COLORS, createJob } from "../data/jobs";

const s = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
  },
  addBtn: {
    background: "#6366f1",
    border: "none",
    borderRadius: 8,
    padding: "9px 18px",
    color: "#fff",
    fontSize: 13,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    cursor: "pointer",
  },
  filters: {
    display: "flex",
    gap: 6,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterBtn: (active, color) => ({
    background: active ? color + "22" : "transparent",
    border: `1px solid ${active ? color : "#1e293b"}`,
    borderRadius: 6,
    padding: "5px 12px",
    color: active ? color : "#64748b",
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: "pointer",
  }),
  criticalBadge: {
    background: "#ef4444",
    color: "#fff",
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    padding: "1px 6px",
    borderRadius: 10,
    marginLeft: 6,
  },
  jobCard: {
    background: "#0f1117",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: "14px 18px",
    marginBottom: 8,
    cursor: "pointer",
    transition: "all 0.15s",
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e2e8f0",
    fontFamily: "'DM Sans', sans-serif",
  },
  jobMeta: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "'DM Sans', sans-serif",
    marginTop: 4,
  },
  statusBadge: (color) => ({
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    color: color,
    background: color + "18",
    padding: "2px 8px",
    borderRadius: 4,
  }),
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#475569",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  },
  detailPanel: {
    background: "#0a0c10",
    border: "1px solid #1e293b",
    borderRadius: 10,
    padding: "18px 22px",
    marginBottom: 12,
  },
  detailRow: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
    fontSize: 13,
  },
  detailLabel: {
    color: "#64748b",
    minWidth: 110,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
  },
  detailValue: {
    color: "#cbd5e1",
    fontFamily: "'DM Sans', sans-serif",
  },
  statusRow: {
    display: "flex",
    gap: 6,
    marginTop: 12,
    flexWrap: "wrap",
  },
  statusStepBtn: (active, color) => ({
    background: active ? color : "transparent",
    border: `1px solid ${color}`,
    borderRadius: 6,
    padding: "4px 10px",
    color: active ? "#fff" : color,
    fontSize: 11,
    fontFamily: "'JetBrains Mono', monospace",
    cursor: "pointer",
  }),
};

export default function FlightBoard({ jobs, onUpdateJobs }) {
  const [filter, setFilter] = useState("All");
  const [selectedJob, setSelectedJob] = useState(null);

  const criticalCount = jobs.filter((j) => j.critical).length;
  const filtered =
    filter === "All"
      ? jobs
      : filter === "Critical"
      ? jobs.filter((j) => j.critical)
      : jobs.filter((j) => j.status === filter);

  const handleAddJob = () => {
    const title = prompt("Job title:");
    if (!title) return;
    const newJob = createJob({ title });
    onUpdateJobs([...jobs, newJob]);
  };

  const handleStatusChange = (jobId, newStatus) => {
    onUpdateJobs(
      jobs.map((j) => {
        if (j.id !== jobId) return j;
        const isNYC =
          newStatus !== j.status ? j.isNYC : j.location?.toLowerCase().includes("nyc") || j.city?.toLowerCase().includes("new york");
        return { ...j, status: newStatus, isNYC };
      })
    );
    if (selectedJob?.id === jobId) {
      setSelectedJob((prev) => ({ ...prev, status: newStatus }));
    }
  };

  const handleToggleCritical = (jobId) => {
    onUpdateJobs(
      jobs.map((j) => (j.id === jobId ? { ...j, critical: !j.critical } : j))
    );
  };

  const handleDelete = (jobId) => {
    if (confirm("Delete this job?")) {
      onUpdateJobs(jobs.filter((j) => j.id !== jobId));
      if (selectedJob?.id === jobId) setSelectedJob(null);
    }
  };

  return (
    <div>
      <div style={s.header}>
        <div style={s.title}>
          Flight Board
          {criticalCount > 0 && (
            <span style={s.criticalBadge}>{criticalCount} critical</span>
          )}
        </div>
        <button style={s.addBtn} onClick={handleAddJob}>
          + New Job
        </button>
      </div>

      <div style={s.filters}>
        {["All", "Critical", ...JOB_STATUSES].map((f) => {
          const color = JOB_STATUS_COLORS[f] || "#6366f1";
          const count =
            f === "All"
              ? jobs.length
              : f === "Critical"
              ? criticalCount
              : jobs.filter((j) => j.status === f).length;
          return (
            <button
              key={f}
              style={s.filterBtn(filter === f, color)}
              onClick={() => setFilter(f)}
            >
              {f} ({count})
            </button>
          );
        })}
      </div>

      {selectedJob && (
        <div style={s.detailPanel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
                {selectedJob.title}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {selectedJob.id}
              </div>
            </div>
            <button
              style={{
                background: "transparent",
                border: "1px solid #334155",
                borderRadius: 6,
                padding: "4px 10px",
                color: "#94a3b8",
                fontSize: 12,
                cursor: "pointer",
              }}
              onClick={() => setSelectedJob(null)}
            >
              Close
            </button>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Status</span>
            <span style={s.detailValue}>
              <span style={s.statusBadge(JOB_STATUS_COLORS[selectedJob.status])}>
                {selectedJob.status}
              </span>
            </span>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Client</span>
            <span style={s.detailValue}>{selectedJob.client || "—"}</span>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Shoot Date</span>
            <span style={s.detailValue}>{selectedJob.shootDate || "—"}</span>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Location</span>
            <span style={s.detailValue}>
              {selectedJob.location || "—"}
              {selectedJob.isNYC && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 10,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#ef4444",
                    background: "#450a0a",
                    padding: "1px 6px",
                    borderRadius: 3,
                  }}
                >
                  NYC — NYPD Permit Required
                </span>
              )}
            </span>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Payroll</span>
            <span style={s.detailValue}>{selectedJob.payrollType}</span>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailLabel}>Critical</span>
            <span style={s.detailValue}>
              <button
                style={{
                  background: selectedJob.critical ? "#ef4444" : "transparent",
                  border: `1px solid ${selectedJob.critical ? "#ef4444" : "#334155"}`,
                  borderRadius: 4,
                  padding: "2px 8px",
                  color: selectedJob.critical ? "#fff" : "#64748b",
                  fontSize: 11,
                  cursor: "pointer",
                }}
                onClick={() => handleToggleCritical(selectedJob.id)}
              >
                {selectedJob.critical ? "Critical" : "Normal"}
              </button>
            </span>
          </div>

          <div style={{ fontSize: 11, color: "#888", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: 1, marginTop: 14, marginBottom: 8 }}>
            Pipeline
          </div>
          <div style={s.statusRow}>
            {JOB_STATUSES.map((st) => (
              <button
                key={st}
                style={s.statusStepBtn(
                  selectedJob.status === st,
                  JOB_STATUS_COLORS[st]
                )}
                onClick={() => handleStatusChange(selectedJob.id, st)}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              style={{ background: "transparent", border: "1px solid #ef4444", borderRadius: 6, padding: "5px 12px", color: "#ef4444", fontSize: 12, cursor: "pointer" }}
              onClick={() => handleDelete(selectedJob.id)}
            >
              Delete Job
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={s.emptyState}>
          No jobs {filter !== "All" ? `with status "${filter}"` : "yet"}. Click
          "+ New Job" to create one.
        </div>
      ) : (
        filtered.map((job) => (
          <div
            key={job.id}
            style={{
              ...s.jobCard,
              borderLeft: `3px solid ${JOB_STATUS_COLORS[job.status]}`,
              background: selectedJob?.id === job.id ? "#131620" : "#0f1117",
            }}
            onClick={() => setSelectedJob(job)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={s.jobTitle}>
                {job.critical && (
                  <span style={{ color: "#ef4444", marginRight: 6, fontSize: 12 }}>●</span>
                )}
                {job.title || "Untitled Job"}
              </span>
              <span style={s.statusBadge(JOB_STATUS_COLORS[job.status])}>
                {job.status}
              </span>
            </div>
            <div style={s.jobMeta}>
              {job.client && <span>{job.client}</span>}
              {job.shootDate && <span style={{ marginLeft: 10 }}>{job.shootDate}</span>}
              {job.location && <span style={{ marginLeft: 10 }}>{job.location}</span>}
              {job.isNYC && (
                <span style={{ marginLeft: 6, color: "#ef4444", fontSize: 11 }}>NYC</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
