# Configuração do Mercado Pago

Este guia mostra como configurar o Mercado Pago para receber pagamentos via PIX automaticamente no Delivery 2026.

## 1. Criar Conta no Mercado Pago

1. Acesse: https://www.mercadopago.com.br
2. Clique em "Criar conta"
3. Complete o cadastro com seus dados
4. Valide seu email e telefone

## 2. Criar Aplicação no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Clique em "Minhas aplicações"
3. Clique em "Criar aplicação"
4. Nome: "Delivery 2026"
5. Tipo: "Aplicação Marketplace"

## 3. Obter Credenciais

### Client ID
1. No painel do Mercado Pago, vá em "Configurações" > "Credenciais"
2. Copie o **Client ID**

### Access Token
1. same place - "Credenciais"
2. Copie o **Access Token** (use o de SandBox para testar)

⚠️ **Importante**: Há dois tipos de token:
- **Sandbox** (teste): prefixo `APP_USR-`
- **Produção** (real): prefixo `APP_PROD-`

## 4. Configurar no Delivery 2026

1. Faça login como Master
2. Vá para `/dashboard`
3. Selecione a loja
4. Acesse "Configurar Pagamentos"
5. Cole o Client ID e Access Token
6. Clique "Salvar Configurações"

## 5. Testar

### Modo Sandbox (teste):
1. Use tokens de SandBox
2. No checkout, escolha PIX
3. O pagamento não será debitado de verdade

### Modo Produção:
1. Use tokens de Produção
2. O cliente paga e o valor vai direto para sua conta

## 6. Configurar PIX no Mercado Pago

1. Vá em "Financeiro" > "Conta Digital"
2. Complete o cadastro bancário
3. Configure sua chave PIX em "Configurações" > "PIX"

## Configurações de Segurança

- Keep suas credenciais em ambiente seguro
- Não compartilhe tokens publicamente
- Use HTTPS em produção

## Taxas do Mercado Pago

| Modalidade | Taxa |
|----------|------|
| PIX | 0,99% |
| Boleto | 3,99% |
| Cartão crédito | 4,99% |
| Cartão débito | 2,99% |

## Suporte

- Email: developers@mercadopago.com
- WhatsApp: (011) 4003-4444

## Solução de Problemas

### "Token inválido"
- Verifique se está usando o token correto (SandBox vs Produção)

### "Chave PIX não encontrada"
- Configure a chave PIX na sua conta Mercado Pago

### "Pagamento não confirmado"
- Verifique se o Webhook está configurado corretamente

### Dúvidas
- Consulte a documentação: https://www.mercadopago.com.br/developers/pt-br/docs