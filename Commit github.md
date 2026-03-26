# Guia para Resolver Erro de Push no GitHub

Este guia descreve os comandos necessários para resolver o erro `[rejected] main -> main (fetch first)` que ocorre quando o repositório remoto contém alterações que você não possui localmente.

## 1. Salve suas alterações locais
Antes de tudo, garanta que suas alterações locais estão commitadas.

```bash
git add .
git commit -m "Descrição das suas alterações"
```

## 2. Sincronize com o repositório remoto
Puxe as alterações do GitHub para o seu computador. O comando abaixo tentará mesclar as alterações remotas com as suas.

```bash
git pull origin main --no-rebase
```

## 3. Resolva conflitos (Se houver)
Se o Git informar que houve um conflito (ex: `CONFLICT (content): Merge conflict in ...`), siga estes passos:

1. Abra os arquivos mencionados no erro no seu editor (VS Code/Trae).
2. Procure pelas marcações de conflito:
   - `<<<<<<< HEAD`: Suas alterações locais.
   - `=======`: Divisor entre o seu código e o código do servidor.
   - `>>>>>>> [ID-do-commit]`: Alterações que vieram do GitHub.
3. Edite o arquivo mantendo apenas o código final desejado e **remova as marcações acima**.
4. Após salvar os arquivos corrigidos, execute:

```bash
# Adicione os arquivos que você corrigiu
git add .

# Finalize o merge com um commit
git commit -m "Resolução de conflitos e merge com o remoto"
```

## 4. Envie para o GitHub
Agora que seu código local está atualizado e sem conflitos, faça o push final.

```bash
git push origin main
```

---
**Dica:** Tente sempre fazer um `git pull origin main` antes de iniciar uma nova tarefa para minimizar a chance de conflitos complexos.
