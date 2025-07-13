const express = require('express');
const path = require('path');
const fs = require('fs').promises; // fs.promises permite usar await
const app = express();
const PORT = 3000;

// Caminho do arquivo de contatos
const contatosPath = path.join(__dirname, 'public', 'api', 'contatos.json');

// Middleware para entender formulários
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'views')));

// Rota para exibir o formulário
app.get('/contato', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'contato.html'));
});

// Envia dados do formulário
app.post('/contato', async (req, res) => {
  const novoContato = {
    nome: req.body.name,
    email: req.body.email,
    assunto: req.body.subject,
    mensagem: req.body.message
  };

  try {
    // Verifica se a pasta public/api existe (se não, cria)
    await fs.mkdir(path.dirname(contatosPath), { recursive: true });

    let contatos = [];

    try {
      const dados = await fs.readFile(contatosPath, 'utf8');
      contatos = JSON.parse(dados);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // Se o arquivo não existir, segue com contatos vazio
    }

    contatos.push(novoContato);

    await fs.writeFile(contatosPath, JSON.stringify(contatos, null, 2), 'utf8');

    // Salva em variável de sessão simplificada (não ideal para produção)
    req.novoContato = novoContato;

    res.redirect('/contato-recebido');
  } catch (error) {
    console.error('Erro ao salvar o contato:', error);
    res.status(500).send('Erro ao salvar o contato.');
  }
});

// Exibe a confirmação
app.get('/contato-recebido', async (req, res) => {
  try {
    const dados = await fs.readFile(contatosPath, 'utf8');
    const contatos = JSON.parse(dados);
    const ultimo = contatos[contatos.length - 1];

    res.send(`
      <h1>Contato recebido! Obrigado, ${ultimo.nome}</h1>
      <p><strong>E-mail:</strong> ${ultimo.email}</p>
      <a href="/">Voltar para página inicial</a>
    `);
  } catch (err) {
    console.error('Erro ao ler o JSON:', err);
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }
});

// Rota para 404 personalizada
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
