# Planilhas com Fórmulas - Guia Completo

Sistema de planilhas integrado no editor de páginas com suporte completo a fórmulas (HyperFormula).

## 🚀 Como Inserir uma Planilha

### No Editor de Páginas:

1. Digite `/` para abrir o menu de blocos
2. Digite `spreadsheet` ou procure "Planilha"
3. Pressione Enter
4. Uma planilha 5x5 será inserida

## 📊 Funcionalidades da Planilha

### ✅ Recursos Disponíveis:

- **Fórmulas Excel-like** com HyperFormula
- **Copiar/Colar** (Ctrl+C / Ctrl+V)
- **Desfazer/Refazer** (Ctrl+Z / Ctrl+Y)
- **Auto-preenchimento** (arrastar o canto da célula)
- **Redimensionar** colunas e linhas
- **Mover** linhas e colunas (arrastar cabeçalho)
- **Filtros** de dados
- **Menu de contexto** (clique direito)
- **Adicionar/Remover** linhas e colunas
- **Congelar** colunas
- **Bordas** personalizadas
- **Alinhamento** de texto
- **Comentários** em células

## 🧮 Como Usar Fórmulas

### Sintaxe Básica

Todas as fórmulas começam com `=` (sinal de igual):

```
=A1        → Referência a célula A1
=A1+B1     → Soma de duas células
=A1*2      → Multiplicação
=SOMA(A1:A10) → Função SOMA
```

### 📐 Fórmulas Matemáticas Básicas

#### Operadores

```excel
=A1+B1          → Adição
=A1-B1          → Subtração
=A1*B1          → Multiplicação
=A1/B1          → Divisão
=A1^2           → Potência (A1 ao quadrado)
=A1*100         → Multiplicar por 100
```

#### Exemplos Práticos

```excel
Células:
A1: 10
A2: 20
A3: 30

Fórmulas:
=A1+A2+A3       → Resultado: 60
=A1*A2          → Resultado: 200
=(A1+A2)/2      → Resultado: 15 (média)
=A3-A1          → Resultado: 20
```

## 📊 Funções Estatísticas

### SOMA, MÉDIA, MIN, MAX

```excel
=SOMA(A1:A10)         → Soma de A1 até A10
=SOMA(A1,B1,C1)       → Soma de células específicas
=SOMA(A:A)            → Soma de toda a coluna A

=MÉDIA(A1:A10)        → Média aritmética
=MED(A1:A10)          → Mesma coisa (alias)

=MÍNIMO(A1:A10)       → Menor valor
=MIN(A1:A10)          → Mesma coisa

=MÁXIMO(A1:A10)       → Maior valor
=MAX(A1:A10)          → Mesma coisa
```

### Contar Valores

```excel
=CONT.VALORES(A1:A10) → Conta células não vazias
=CONTAR.VAZIO(A1:A10) → Conta células vazias
=CONT.NÚM(A1:A10)     → Conta apenas números
```

### Desvio Padrão e Variância

```excel
=DESVPAD(A1:A10)      → Desvio padrão
=VAR(A1:A10)          → Variância
```

## 🔢 Funções Matemáticas Avançadas

### Arredondamento

```excel
=ARRED(A1; 2)         → Arredonda para 2 casas decimais
=ARREDONDAR.PARA.CIMA(A1; 0) → Arredonda para cima
=ARREDONDAR.PARA.BAIXO(A1; 0) → Arredonda para baixo
=TRUNCAR(A1; 2)       → Trunca em 2 casas
=INT(A1)              → Parte inteira (arredonda para baixo)
```

### Funções Especiais

```excel
=ABS(A1)              → Valor absoluto
=RAIZ(A1)             → Raiz quadrada
=POT(A1; 3)           → A1 elevado a 3
=EXP(A1)              → e^A1 (exponencial)
=LN(A1)               → Logaritmo natural
=LOG10(A1)            → Logaritmo base 10
=LOG(A1; 2)           → Logaritmo base 2
```

### Trigonometria

```excel
=SEN(A1)              → Seno
=COS(A1)              → Cosseno
=TAN(A1)              → Tangente
=ASEN(A1)             → Arco seno
=ACOS(A1)             → Arco cosseno
=ATAN(A1)             → Arco tangente
```

## 🧩 Funções Lógicas

### SE (IF)

```excel
=SE(A1>10; "Maior"; "Menor")
  → Se A1 > 10, exibe "Maior", senão "Menor"

=SE(A1>=90; "A"; SE(A1>=80; "B"; "C"))
  → Notas: A (>=90), B (>=80), C (<80)

=SE(E(A1>10; B1<20); "OK"; "Não")
  → SE A1>10 E B1<20, "OK"
```

### E, OU, NÃO

```excel
=E(A1>10; B1<20)      → TRUE se ambos verdadeiros
=OU(A1>10; B1<20)     → TRUE se um for verdadeiro
=NÃO(A1>10)           → Inverte: TRUE se A1<=10
```

### Verificações

```excel
=ÉERRO(A1/B1)         → TRUE se der erro (ex: divisão por zero)
=ÉVAZIO(A1)           → TRUE se célula vazia
=ÉNÚM(A1)             → TRUE se é número
=ÉTEXTO(A1)           → TRUE se é texto
```

## 📅 Funções de Data e Hora

### Data Atual

```excel
=HOJE()               → Data de hoje
=AGORA()              → Data e hora atual
=ANO(HOJE())          → Ano atual (2025)
=MÊS(HOJE())          → Mês atual (1-12)
=DIA(HOJE())          → Dia do mês (1-31)
```

### Manipular Datas

```excel
=DATA(2025; 1; 15)    → Cria data: 15/01/2025
=DATADIF(A1; B1; "D") → Diferença em dias entre datas
=DIA.DA.SEMANA(HOJE()) → Dia da semana (1=Domingo)
```

### Operações com Datas

```excel
=HOJE()+30            → Daqui a 30 dias
=HOJE()-7             → 7 dias atrás
=ANO(A1)-ANO(B1)      → Diferença de anos
```

## 📝 Funções de Texto

### Manipulação de Strings

```excel
=CONCATENAR(A1; " "; B1)  → Junta textos com espaço
=A1&" "&B1                → Mesma coisa (operador &)

=MAIÚSCULA(A1)            → CONVERTE PARA MAIÚSCULAS
=MINÚSCULA(A1)            → converte para minúsculas
=PRI.MAIÚSCULA(A1)        → Primeira Letra Maiúscula

=ESQUERDA(A1; 5)          → 5 primeiros caracteres
=DIREITA(A1; 3)           → 3 últimos caracteres
=EXT.TEXTO(A1; 2; 4)      → 4 caracteres a partir da posição 2

=NÚM.CARACT(A1)           → Quantidade de caracteres
=PROCURAR("texto"; A1)    → Posição de "texto" em A1
=SUBSTITUIR(A1; "velho"; "novo") → Substitui texto
```

### Limpeza e Formatação

```excel
=ARRUMAR(A1)              → Remove espaços extras
=LIMPAR(A1)               → Remove caracteres não imprimíveis
=SUBSTITUIR(A1; " "; "")  → Remove todos os espaços
```

## 🔍 Funções de Busca e Referência

### PROCV (VLOOKUP)

```excel
=PROCV(valor; intervalo; coluna; 0)

Exemplo:
Tabela em A1:C5:
ID | Nome    | Idade
1  | João    | 25
2  | Maria   | 30
3  | Pedro   | 28

=PROCV(2; A1:C5; 2; 0)    → "Maria"
=PROCV(2; A1:C5; 3; 0)    → 30
```

### ÍNDICE e CORRESP

```excel
=ÍNDICE(A1:A10; 5)        → Valor da 5ª linha
=CORRESP("João"; A1:A10; 0) → Posição de "João"

=ÍNDICE(B1:B10; CORRESP(D1; A1:A10; 0))
  → Busca D1 em A1:A10 e retorna valor correspondente em B
```

## 💰 Funções Financeiras

### Básicas

```excel
=SOMA.SE(A1:A10; ">100")  → Soma apenas valores >100
=MÉDIA.SE(A1:A10; "<50")  → Média apenas valores <50
=CONT.SE(A1:A10; "Pago")  → Conta quantos "Pago"
```

### Juros e Investimentos

```excel
=VP(taxa; períodos; pgto)  → Valor presente
=VF(taxa; períodos; pgto)  → Valor futuro
=PGTO(taxa; períodos; vp)  → Pagamento periódico
```

## 🎯 Exemplos Práticos Completos

### 1. Orçamento Pessoal

```
     A          B         C         D
1  Item      Valor    Status    Total
2  Salário   5000
3  Aluguel   -1500    Pago
4  Comida    -800     Pago
5  Lazer     -300     Pendente
6  Total     =SOMA(B2:B5)
7  Balanço   =SE(B6>0;"Positivo";"Negativo")
```

### 2. Controle de Vendas

```
     A        B       C          D
1  Produto  Qtd    Preço      Total
2  Caneta   10     1.50       =B2*C2
3  Caderno  5      12.00      =B3*C3
4  Livro    3      45.00      =B4*C4
5  TOTAL                      =SOMA(D2:D4)
6  Média                      =MÉDIA(D2:D4)
```

### 3. Notas de Alunos

```
     A       B    C    D      E
1  Aluno   P1   P2   P3    Média  Status
2  João    8    7    9     =MÉDIA(B2:D2)  =SE(E2>=7;"Aprovado";"Reprovado")
3  Maria   6    8    7     =MÉDIA(B3:D3)  =SE(E3>=7;"Aprovado";"Reprovado")
4  Pedro   5    6    4     =MÉDIA(B4:D4)  =SE(E4>=7;"Aprovado";"Reprovado")
```

### 4. Controle de Estoque

```
     A         B          C         D
1  Produto  Estoque  Mínimo    Alerta
2  Item A   50       20        =SE(B2<C2;"COMPRAR";"OK")
3  Item B   15       20        =SE(B3<C3;"COMPRAR";"OK")
4  Item C   100      50        =SE(B4<C4;"COMPRAR";"OK")
```

### 5. Cálculo de Porcentagem

```
     A        B         C
1  Valor   Total    Percentual
2  150     500      =A2/B2*100
3  200     500      =A3/B3*100
4  150     500      =A4/B4*100
5  Total   =SOMA(A2:A4)  =SOMA(C2:C4)
```

## ⚙️ Recursos Avançados

### Menu de Contexto (Clique Direito)

- **Inserir linha acima/abaixo**
- **Inserir coluna à esquerda/direita**
- **Remover linha/coluna**
- **Congelar coluna** (útil para cabeçalhos)
- **Adicionar bordas**
- **Alinhamento** (esquerda, centro, direita)
- **Copiar/Colar**
- **Desfazer/Refazer**

### Arrastar para Auto-preencher

1. Digite uma fórmula (ex: `=A1*2` em B1)
2. Clique no **canto inferior direito** da célula
3. **Arraste para baixo** ou para o lado
4. A fórmula é copiada ajustando as referências:
   - B1: `=A1*2`
   - B2: `=A2*2`
   - B3: `=A3*2`

### Referências Absolutas

Use `$` para fixar linha ou coluna:

```excel
=A1*$B$1    → B1 nunca muda ao copiar
=A1*B$1     → Linha 1 fixa, coluna B varia
=A1*$B1     → Coluna B fixa, linha 1 varia
```

### Atalhos de Teclado

- `Ctrl+C` → Copiar
- `Ctrl+V` → Colar
- `Ctrl+X` → Recortar
- `Ctrl+Z` → Desfazer
- `Ctrl+Y` → Refazer
- `Delete` → Limpar célula
- `Enter` → Próxima linha
- `Tab` → Próxima coluna
- `F2` → Editar célula

## 🐛 Erros Comuns e Soluções

### #DIV/0!
**Erro:** Divisão por zero
**Solução:** `=SE(B1=0; 0; A1/B1)`

### #NOME?
**Erro:** Nome de função desconhecido
**Solução:** Verifique ortografia da função

### #REF!
**Erro:** Referência inválida (célula deletada)
**Solução:** Corrigir referências

### #VALOR!
**Erro:** Tipo de dado errado (texto onde esperava número)
**Solução:** Verificar dados de entrada

### Célula mostra fórmula em vez do resultado
**Problema:** Texto começa com `=` mas não é reconhecido como fórmula
**Solução:** Digite `'=texto` para forçar como texto

## 💡 Dicas de Produtividade

1. **Use nomes descritivos** nos cabeçalhos
2. **Formate números** com casas decimais consistentes
3. **Congele colunas** de cabeçalho para grandes planilhas
4. **Use cores** para destacar células importantes
5. **Documente fórmulas complexas** com comentários
6. **Teste fórmulas** com dados pequenos primeiro
7. **Faça backup** antes de grandes mudanças
8. **Use PROCV** para relacionar tabelas
9. **Organize dados** em colunas (não em linhas)
10. **Evite referências circulares** (A1=B1, B1=A1)

## 📚 Funções Completas Disponíveis

### Matemática
SOMA, MÉDIA, MIN, MAX, ABS, RAIZ, POT, EXP, LN, LOG, LOG10, ARRED, INT, TRUNCAR, SEN, COS, TAN, ASEN, ACOS, ATAN, PI, ALEATÓRIO

### Lógica
SE, E, OU, NÃO, VERDADEIRO, FALSO, ÉERRO, ÉVAZIO, ÉNÚM, ÉTEXTO

### Texto
CONCATENAR, MAIÚSCULA, MINÚSCULA, PRI.MAIÚSCULA, ESQUERDA, DIREITA, EXT.TEXTO, NÚM.CARACT, PROCURAR, LOCALIZAR, SUBSTITUIR, ARRUMAR, LIMPAR

### Data/Hora
HOJE, AGORA, ANO, MÊS, DIA, DATA, HORA, MINUTO, SEGUNDO, DIA.DA.SEMANA, DATADIF

### Estatística
MÉDIA, DESVPAD, VAR, CONT.VALORES, CONTAR.VAZIO, CONT.NÚM, CONT.SE, SOMA.SE, MÉDIA.SE

### Busca
PROCV, PROCH, ÍNDICE, CORRESP, ESCOLHER

### Financeira
VP, VF, PGTO, TAXA, NPER

---

**Desenvolvido com:** Handsontable + HyperFormula
**Versão:** 1.0.0
