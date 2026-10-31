# Segurança e Cofre de Acessos a Canais

## 1. Arquitetura do Cofre de Credenciais (Zero-Trust)

Na rotina de implantação e suporte de canais hoteleiros, a equipe lida constantemente com acessos a extranets de parceiros (Booking.com, Airbnb, Expedia, Decolar) e channel managers. A guarda de credenciais em documentos de texto compartilhados ou planilhas é terminantemente proibida.

### 1.1 Padrão de Criptografia
- **Algoritmo:** **AES-256-GCM** (Galois/Counter Mode) autenticado.
- **Chave Mestra de Criptografia:** Isolada estritamente em variáveis de ambiente seguras do servidor (`VAULT_ENCRYPTION_KEY`). Nunca versionada no repositório.
- **Vetores de Inicialização (IV):** Para cada registro de credencial salvo, é gerado um IV aleatório de 12 bytes (96 bits, recomendação do NIST SP 800-38D para GCM) armazenado junto ao dado cifrado e à tag de autenticação.
- **Versão da Chave (`key_version`):** cada registro guarda a versão da chave mestra que o cifrou, permitindo trocar a chave no futuro sem perder os dados antigos.

---

## 2. Fluxo de Acesso Rápido a Extranets

```
[ Linha do canal: Booking.com ]
  ├── Clique no ID, no Usuário ou na Senha → copia aquele valor
  ├── [Eye] → revela a senha em texto
  └── [ Copiar e Abrir Extranet ]
        1. copia a senha
        2. aguarda ~700ms
        3. copia o usuário
        4. abre a extranet do canal em nova guia
```

Resultado: `Ctrl+V` cola o usuário e `Win+V` (histórico da área de transferência do Windows) oferece a senha. Detalhes de interface em `03-modulos/clientes/clientes-design-v2.md` (seção 04.5).

**Decisões de produto (30/10/2026):**
- **Sem limpeza automática do clipboard.**
- **Sem registro de auditoria** de cópias ou revelações de senha.

---

## 3. Matriz de Permissões e Perfis (RBAC)

| Ação / Recurso | Operador de Rotina | Analista de Implantação | Administrador / Gestor |
| :--- | :---: | :---: | :---: |
| Visualizar Dados Gerais do Hotel | Sim | Sim | Sim |
| Copiar Credencial de Canal Vinculado | Sim | Sim | Sim |
| Revelar Senha em Texto Aberto | Sim | Sim | Sim |
| Adicionar, Editar e Remover Credenciais | Não | Não | Sim |
| Editar Dados Técnicos do Cliente | Não | Sim | Sim |
| Configurações da Instância e Painel Admin | Não | Não | Sim |
| Forçar Conclusão de Demanda Bloqueada | Não | Não | Sim |
