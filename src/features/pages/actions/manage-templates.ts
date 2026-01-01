'use server';

/**
 * Server actions para gerenciar templates de páginas
 */

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CreateTemplateInput {
  workspaceId: string;
  title: string;
  description?: string;
  icon?: string | null;
  content: any;
  category?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  content_json: any;
  category: string | null;
  created_at: string;
  created_by: string;
  is_public: boolean;
}

/**
 * Cria um template a partir de uma página ou do zero
 */
export async function createTemplate(
  input: CreateTemplateInput
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const { workspaceId, title, description, icon, content, category } = input;

    const supabase = await createServerClient() as any;

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Criar página template
    const { data: template, error } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspaceId,
        title,
        content_json: content,
        content_text: JSON.stringify(content),
        icon,
        template_id: null, // É um template, não uma instância
        is_folder: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !template) {
      console.error('Error creating template:', error);
      return { success: false, error: 'Erro ao criar template' };
    }

    // Marcar como template usando o próprio ID
    const { error: updateError } = await supabase
      .from('pages')
      .update({ template_id: template.id })
      .eq('id', template.id);

    if (updateError) {
      console.error('Error marking as template:', updateError);
    }

    revalidatePath(`/${workspaceId}/pages`);

    return { success: true, templateId: template.id };
  } catch (error) {
    console.error('Error creating template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar template',
    };
  }
}

/**
 * Salva página atual como template
 */
export async function savePageAsTemplate(input: {
  pageId: string;
  workspaceId: string;
  templateTitle?: string;
  templateDescription?: string;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const { pageId, workspaceId, templateTitle, templateDescription } = input;

    const supabase = await createServerClient() as any;

    // Buscar página original
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('workspace_id', workspaceId)
      .single();

    if (pageError || !page) {
      return { success: false, error: 'Página não encontrada' };
    }

    // Criar template baseado na página
    return createTemplate({
      workspaceId,
      title: templateTitle || `Template: ${page.title}`,
      description: templateDescription,
      icon: page.icon,
      content: page.content_json,
    });
  } catch (error) {
    console.error('Error saving page as template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao salvar template',
    };
  }
}

/**
 * Lista templates disponíveis
 */
export async function listTemplates(workspaceId: string): Promise<Template[]> {
  try {
    const supabase = await createServerClient() as any;

    // Buscar templates (páginas onde template_id = id)
    const { data: templates, error } = await supabase
      .from('pages')
      .select('*')
      .eq('workspace_id', workspaceId)
      .not('template_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing templates:', error);
      return [];
    }

    return (templates || []).filter((t: any) => t.template_id === t.id) as Template[];
  } catch (error) {
    console.error('Error listing templates:', error);
    return [];
  }
}

/**
 * Cria uma nova página a partir de um template
 */
export async function createPageFromTemplate(input: {
  templateId: string;
  workspaceId: string;
  parentId?: string | null;
  title?: string;
}): Promise<{ success: boolean; pageId?: string; error?: string }> {
  try {
    const { templateId, workspaceId, parentId, title } = input;

    const supabase = await createServerClient() as any;

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Buscar template
    const { data: template, error: templateError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return { success: false, error: 'Template não encontrado' };
    }

    // Buscar posição máxima para o parent
    const { data: siblings } = await supabase
      .from('pages')
      .select('position')
      .eq('workspace_id', workspaceId)
      .eq('parent_id', parentId || null)
      .order('position', { ascending: false })
      .limit(1);

    const maxPosition = siblings && siblings.length > 0 ? siblings[0].position : 0;

    // Criar nova página a partir do template
    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert({
        workspace_id: workspaceId,
        title: title || template.title,
        content_json: template.content_json,
        content_text: template.content_text,
        icon: template.icon,
        cover: template.cover,
        parent_id: parentId || null,
        position: maxPosition + 1,
        template_id: templateId,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError || !newPage) {
      console.error('Error creating page from template:', createError);
      return { success: false, error: 'Erro ao criar página do template' };
    }

    revalidatePath(`/${workspaceId}/pages`);

    return { success: true, pageId: newPage.id };
  } catch (error) {
    console.error('Error creating page from template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar página do template',
    };
  }
}

/**
 * Deleta um template
 */
export async function deleteTemplate(input: {
  templateId: string;
  workspaceId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { templateId, workspaceId } = input;

    const supabase = await createServerClient() as any;

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuário não autenticado' };
    }

    // Verificar se é realmente um template
    const { data: template } = await supabase
      .from('pages')
      .select('template_id, created_by')
      .eq('id', templateId)
      .single();

    if (!template || template.template_id !== templateId) {
      return { success: false, error: 'Não é um template válido' };
    }

    // Verificar se é o criador
    if (template.created_by !== user.id) {
      return { success: false, error: 'Sem permissão para deletar este template' };
    }

    // Deletar template
    const { error } = await supabase.from('pages').delete().eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      return { success: false, error: 'Erro ao deletar template' };
    }

    revalidatePath(`/${workspaceId}/pages`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar template',
    };
  }
}
