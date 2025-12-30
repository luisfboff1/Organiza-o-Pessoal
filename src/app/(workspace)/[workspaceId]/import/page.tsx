import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function ImportPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Importar CSV</h1>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Finanças</CardTitle>
              <CardDescription>
                Importar lançamentos financeiros do Notion em CSV
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Importar Projetos</CardTitle>
              <CardDescription>
                Importar projetos do Notion em CSV
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Importar Tasks</CardTitle>
              <CardDescription>
                Importar tarefas do Notion em CSV
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h3 className="font-semibold mb-2">Como importar</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Exporte seus dados do Notion como CSV</li>
            <li>Selecione o tipo de dados a importar acima</li>
            <li>Faça upload do arquivo CSV</li>
            <li>Mapeie as colunas para os campos do sistema</li>
            <li>Revise o preview e confirme a importação</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
