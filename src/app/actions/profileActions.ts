"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function updateEmailAdmin(email: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return { error: "Usuário não autenticado." };
    }

    // Atualiza o e-mail no Supabase Auth usando o cliente admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: email.trim(),
      email_confirm: true, // Auto-confirma o e-mail para evitar necessidade de link
    });

    if (updateError) {
      return { error: updateError.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || "Ocorreu um erro interno ao atualizar o e-mail." };
  }
}
