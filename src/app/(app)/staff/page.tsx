import React from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/server/policies/permissions";
import { listTeamMembers } from "@/server/services/auth";
import { GlassCard } from "@/components/glass/glass-card";
import { CreateStaffDialog } from "@/components/staff/create-staff-dialog";
import { Users, Shield, Briefcase, Calendar } from "lucide-react";
import { format } from "date-fns";

export const metadata = {
  title: "Team & Staff Management - Brightloop Billing",
  description: "Manage internal staff and administrators",
};

export default async function StaffPage() {
  // Enforce ADMIN role on the server
  try {
    await requireRole(["ADMIN"]);
  } catch {
    redirect("/dashboard");
  }

  const team = await listTeamMembers();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#22d3ee]" />
            Internal Staff & Access
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Admin-only staff management. Create team accounts and audit permissions.
          </p>
        </div>

        <CreateStaffDialog />
      </div>

      {/* Staff Table */}
      <GlassCard className="p-0 overflow-hidden border border-white/10">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-wide uppercase">
            Active Team Members ({team.length})
          </span>
          <span className="text-[11px] text-zinc-400 font-mono">ROLE PERMISSIONS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/5 text-zinc-400">
              <tr>
                <th className="py-3 px-6 font-medium">Team Member</th>
                <th className="py-3 px-6 font-medium">Email</th>
                <th className="py-3 px-6 font-medium">Role</th>
                <th className="py-3 px-6 font-medium">Created On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {team.map((member) => (
                <tr
                  key={member.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3.5 px-6 font-medium text-white flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-[#22d3ee]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{member.name}</span>
                  </td>
                  <td className="py-3.5 px-6 font-mono text-zinc-300">
                    {member.email}
                  </td>
                  <td className="py-3.5 px-6">
                    {member.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#6d5dfc]/15 border border-[#6d5dfc]/30 text-[#a78bfa] font-semibold text-[10px]">
                        <Shield className="w-3 h-3" />
                        ADMIN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#22d3ee]/15 border border-[#22d3ee]/30 text-[#22d3ee] font-semibold text-[10px]">
                        <Briefcase className="w-3 h-3" />
                        STAFF
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-zinc-400 font-mono text-[11px]">
                    {format(new Date(member.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

