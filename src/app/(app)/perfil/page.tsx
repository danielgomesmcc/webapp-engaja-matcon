import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ firstAccess?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { firstAccess } = await searchParams;

  let { data: profile } = await supabase
    .from("profiles")
    .select("*, departments(name)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const username = user.user_metadata?.username || user.email?.split("@")[0] || `user_${user.id.substring(0, 8)}`;
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username,
        email: user.email,
        full_name: user.user_metadata?.full_name || username,
        role: (user.user_metadata?.role || "user") as any,
        must_change_password: user.user_metadata?.must_change_password ?? true,
      })
      .select("*, departments(name)")
      .maybeSingle();

    if (newProfile) {
      profile = newProfile;
    } else {
      // Fallback local se falhar a inserção no banco
      profile = {
        id: user.id,
        username,
        email: user.email,
        full_name: username,
        role: "user",
        points: 0,
        must_change_password: true,
      };
    }
  }

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  return (
    <ProfileClient
      profile={profile}
      userId={user.id}
      departments={departments || []}
      firstAccess={firstAccess === "1"}
    />
  );
}
