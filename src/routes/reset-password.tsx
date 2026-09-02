import React, { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, Lock } from "lucide-react";

function ResetPasswordComponent() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("تم تحديث كلمة السر بنجاح!");
      navigate({ to: "/auth" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] flex items-center justify-center p-4 dir-rtl font-sans">
      <div className="w-full max-w-md bg-[#121620]/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="flex items-center space-x-3 space-x-reverse mb-6">
          <div className="p-3 bg-[#2E5BFF]/20 border border-[#2E5BFF]/30 rounded-xl">
            <KeyRound className="text-[#00E5FF] w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">تعيين كلمة سر جديدة</h2>
            <p className="text-xs text-gray-400">أدخل كلمة السر الجديدة لحسابك</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">كلمة السر الجديدة</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-gray-500 absolute right-3 top-3" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0A0D14] border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#2E5BFF] text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2E5BFF] to-[#00E5FF] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition text-sm disabled:opacity-50"
          >
            {loading ? "جاري التحديث..." : "حفظ كلمة السر"}
          </button>
        </form>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordComponent,
});
