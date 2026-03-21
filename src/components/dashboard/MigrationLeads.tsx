'use client';

import React, { useState, useEffect } from 'react';

/* ────────────────────────────────────────────────────────────
   MigrationLeads — Super Admin dashboard panel
   
   Shows all migration requests as leads.
   Plugs into the existing dashboard Provisioning tab or as
   a new "Leads" tab.
   ──────────────────────────────────────────────────────────── */

const SERVICE_B_URL = process.env.NEXT_PUBLIC_SERVICE_B_URL || 'http://localhost:9000';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cx_access_token');
}

async function fetchB(path: string): Promise<any> {
  const token = getAccessToken();
  const res = await fetch(`${SERVICE_B_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const colors = {
  bg: '#080D18', s1: '#0D1526', s2: '#111D30',
  b1: '#1C2D45', b2: '#243558',
  tx: '#DDE6F5', tx2: '#7A90B5', tx3: '#4A5F80',
  blue: '#3370E8', teal: '#00C9B1', amber: '#F5A623',
  red: '#F03060', green: '#00DE7A', purple: '#8B5CF6',
};

interface Lead {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  company_name: string;
  ivr_phone: string | null;
  path: string;
  tier: number;
  status: string;
  tenant_key: string | null;
  uploaded_files: any[];
  created_at: string;
}

export default function MigrationLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadLeads();
    // Refresh every 30s
    const interval = setInterval(loadLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadLeads = async () => {
    try {
      const data = await fetchB('/migrate/leads');
      setLeads(data.leads || []);
    } catch (e) {
      console.error('Failed to load leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all'
    ? leads
    : leads.filter(l => l.status === filter);

  const statusColor = (s: string) => {
    switch (s) {
      case 'lead': return colors.amber;
      case 'processing': case 'provisioning': case 'compiling': case 'publishing': return colors.teal;
      case 'complete': return colors.green;
      case 'failed': return colors.red;
      default: return colors.tx3;
    }
  };

  const pathLabel = (p: string) => p === 'file_upload' ? '📄 Upload' : '📞 IVR Number';
  const tierLabel = (t: number) => t === 3 ? 'Tier 3 (VM + DB)' : 'Tier 4 (Basic)';

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: colors.tx3, fontSize: 13 }}>
        Loading migration leads...
      </div>
    );
  }

  return (
    <div>
      {/* Header + filters */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Migration Leads</h3>
          <span style={{
            padding: '2px 8px', borderRadius: 4,
            background: 'rgba(51,112,232,.1)', color: colors.blue,
            fontSize: 11, fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {leads.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', 'lead', 'processing', 'complete', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 10px', borderRadius: 5, border: 'none',
                background: filter === f ? colors.blue : 'transparent',
                color: filter === f ? '#fff' : colors.tx3,
                fontSize: 10, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize' as const,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{
          padding: 32, textAlign: 'center', color: colors.tx3, fontSize: 13,
          background: colors.s1, borderRadius: 10, border: `1px solid ${colors.b1}`,
        }}>
          No migration leads {filter !== 'all' ? `with status "${filter}"` : 'yet'}.
        </div>
      ) : (
        <div style={{
          background: colors.s1, borderRadius: 10, border: `1px solid ${colors.b1}`,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.b1}` }}>
                {['Company', 'Contact', 'Path', 'IVR Phone', 'Tier', 'Status', 'When'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 10, fontWeight: 600, color: colors.tx3,
                    textTransform: 'uppercase' as const, letterSpacing: 0.5,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr
                  key={lead.id}
                  style={{ borderBottom: `1px solid rgba(28,45,69,.4)` }}
                >
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                    {lead.company_name || '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: 11 }}>{lead.full_name || '—'}</div>
                    <div style={{ fontSize: 10, color: colors.tx3 }}>{lead.email}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11 }}>
                    {pathLabel(lead.path)}
                    {lead.uploaded_files?.length > 0 && (
                      <div style={{ fontSize: 9, color: colors.tx3 }}>
                        {lead.uploaded_files.length} file{lead.uploaded_files.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td style={{
                    padding: '10px 14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, color: lead.ivr_phone ? colors.tx : colors.tx3,
                  }}>
                    {lead.ivr_phone || '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '2px 6px', borderRadius: 3,
                      fontSize: 9, fontWeight: 600,
                      background: lead.tier === 3 ? 'rgba(139,92,246,.1)' : 'rgba(0,201,177,.1)',
                      color: lead.tier === 3 ? colors.purple : colors.teal,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {tierLabel(lead.tier)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 4,
                      fontSize: 10, fontWeight: 600,
                      background: `${statusColor(lead.status)}15`,
                      color: statusColor(lead.status),
                      textTransform: 'capitalize' as const,
                    }}>
                      {lead.status}
                    </span>
                  </td>
                  <td style={{
                    padding: '10px 14px', fontSize: 10, color: colors.tx3,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {lead.created_at ? timeAgo(lead.created_at) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
