// Catálogo demonstrativo. Os dados e preços são fictícios.
const catalogoInicial = [
  { id: 1, nome: "Prato regional", descricao: "Uma opção saborosa da casa.", preco: 25, categoria: "pratos", imagem: "🍛" },
  { id: 2, nome: "Pastel artesanal", descricao: "Preparado com muito carinho.", preco: 10, categoria: "salgados", imagem: "🥟" },
  { id: 3, nome: "Bolo de milho", descricao: "Receita tradicional nordestina.", preco: 8, categoria: "sobremesas", imagem: "🍰" },
  { id: 4, nome: "Suco natural", descricao: "Bebida refrescante.", preco: 7, categoria: "bebidas", imagem: "🥤" },
  { id: 5, nome: "Cuscuz recheado", descricao: "Uma delícia regional.", preco: 18, categoria: "pratos", imagem: "🌽" },
  { id: 6, nome: "Coxinha", descricao: "Salgado crocante e saboroso.", preco: 7, categoria: "salgados", imagem: "🥟" }
];
let produtos = (() => {
  try {
    const salvos = JSON.parse(localStorage.getItem("catalogoRaizes"));
    return Array.isArray(salvos) && salvos.length ? salvos : catalogoInicial;
  } catch { return catalogoInicial; }
})();
function salvarCatalogo() { localStorage.setItem("catalogoRaizes", JSON.stringify(produtos)); }

const formatarPreco = valor => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const lerCarrinho = () => {
  try {
    const itens = JSON.parse(localStorage.getItem("carrinho")) || [];
    return itens.map((item, indice) => ({
      ...item,
      lineId: item.lineId || `legado-${item.id}-${indice}-${Date.now()}`,
      precoUnitario: item.precoUnitario || item.preco
    }));
  } catch { return []; }
};
let carrinho = lerCarrinho();

function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  atualizarContador();
}
function atualizarContador() {
  const contador = document.getElementById("contadorCarrinho");
  if (contador) contador.textContent = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
}

// Página inicial: unidade, busca, filtros e catálogo.
const seletorUnidade = document.getElementById("unidade");
if (seletorUnidade) {
  const unidadeSalva = localStorage.getItem("unidadeSelecionada");
  if (unidadeSalva) seletorUnidade.value = unidadeSalva;

  seletorUnidade.addEventListener("change", () => {
    const novaUnidade = seletorUnidade.value;
    if (!novaUnidade) {
      localStorage.removeItem("unidadeSelecionada");
      return;
    }
    if (carrinho.length && carrinho.some(item => item.unidade !== novaUnidade)) {
      const confirmar = confirm("Seu carrinho contém itens de outra unidade. Deseja esvaziá-lo e trocar de unidade?");
      if (!confirmar) {
        seletorUnidade.value = localStorage.getItem("unidadeSelecionada") || "";
        return;
      }
      carrinho = [];
      salvarCarrinho();
    }
    localStorage.setItem("unidadeSelecionada", novaUnidade);
    alert("Unidade selecionada com sucesso!");
  });
}

const listaProdutos = document.getElementById("listaProdutos");
if (listaProdutos) {
  const campoBusca = document.getElementById("buscaProduto");
  const mensagemVazia = document.getElementById("mensagemVazia");
  let categoriaAtual = "todos";

  function exibirProdutos() {
    const termo = campoBusca.value.trim().toLocaleLowerCase("pt-BR");
    const unidadeAtual = localStorage.getItem("unidadeSelecionada");
    const filtrados = produtos.filter(produto => {
      const unidadeOk = !produto.unidade || produto.unidade === "todas" || produto.unidade === unidadeAtual;
      const disponivelOk = produto.disponivel !== false;
      const categoriaOk = categoriaAtual === "todos" || produto.categoria === categoriaAtual;
      const buscaOk = produto.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        produto.descricao.toLocaleLowerCase("pt-BR").includes(termo);
      return unidadeOk && disponivelOk && categoriaOk && buscaOk;
    });

    listaProdutos.replaceChildren();
    filtrados.forEach(produto => {
      const card = document.createElement("article");
      card.className = "produto";

      const imagem = document.createElement("div");
      imagem.className = "imagem-produto";
      imagem.textContent = produto.imagem;

      const nome = document.createElement("h3");
      nome.textContent = produto.nome;

      const descricao = document.createElement("p");
      descricao.textContent = produto.descricao;

      const preco = document.createElement("strong");
      preco.textContent = formatarPreco(produto.preco);

      const botao = document.createElement("button");
      botao.type = "button";
      botao.dataset.adicionar = String(produto.id);
      botao.textContent = "Personalizar pedido";

      card.append(imagem, nome, descricao, preco, botao);
      listaProdutos.appendChild(card);
    });
    mensagemVazia.hidden = filtrados.length > 0;
  }

  document.querySelectorAll(".filtro").forEach(botao => {
    botao.addEventListener("click", () => {
      categoriaAtual = botao.dataset.categoria;
      document.querySelectorAll(".filtro").forEach(item => item.classList.remove("ativo"));
      botao.classList.add("ativo");
      exibirProdutos();
    });
  });

  campoBusca.addEventListener("input", exibirProdutos);

  listaProdutos.addEventListener("click", evento => {
    const botao = evento.target.closest("[data-adicionar]");
    if (!botao) return;

    const unidade = localStorage.getItem("unidadeSelecionada");
    if (!unidade) {
      alert("Selecione uma unidade antes de adicionar produtos.");
      seletorUnidade.focus();
      return;
    }

    const produto = produtos.find(item => item.id === Number(botao.dataset.adicionar));
    if (!produto) return;

    window.location.href = `produto.html?id=${produto.id}`;
  });

  exibirProdutos();
}

// Página do carrinho.
const itensCarrinho = document.getElementById("itensCarrinho");
if (itensCarrinho) {
  const resumoUnidade = document.getElementById("resumoUnidade");
  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");
  const botaoContinuar = document.getElementById("botaoContinuar");
  const resumoPedido = document.getElementById("resumoPedido");

  function renderizarCarrinho() {
    itensCarrinho.replaceChildren();

    if (carrinho.length === 0) {
      const vazio = document.createElement("div");
      vazio.className = "carrinho-vazio";
      vazio.innerHTML = "<strong>Seu carrinho está vazio.</strong><p>Volte ao cardápio e escolha seus sabores favoritos.</p>";
      itensCarrinho.appendChild(vazio);
      resumoPedido.hidden = true;
      resumoUnidade.textContent = "Nenhuma unidade selecionada.";
      return;
    }

    resumoPedido.hidden = false;
    const unidade = carrinho[0].unidade;
    resumoUnidade.textContent = `Unidade: ${unidade === "centro" ? "Unidade Centro" : "Unidade Praia"}`;

    carrinho.forEach(item => {
      const linha = document.createElement("article");
      linha.className = "item-carrinho";
      const emoji = document.createElement("div");
      emoji.className = "item-emoji";
      emoji.textContent = item.imagem;
      const info = document.createElement("div");
      info.className = "item-info";
      const nome = document.createElement("h3");
      nome.textContent = item.nome;
      const detalhes = document.createElement("p");
      const adicionais = (item.adicionaisSelecionados || []).map(a => a.nome).join(", ");
      detalhes.textContent = `${formatarPreco(item.precoUnitario || item.preco)} cada${adicionais ? ` · Adicionais: ${adicionais}` : ""}${item.observacao ? ` · Obs.: ${item.observacao}` : ""}`;
      const controles = document.createElement("div");
      controles.className = "controles-quantidade";
      const menos = document.createElement("button");
      menos.type = "button"; menos.textContent = "−"; menos.setAttribute("aria-label", `Diminuir ${item.nome}`);
      menos.addEventListener("click", () => alterarQuantidade(item.lineId, -1));
      const quantidade = document.createElement("strong"); quantidade.textContent = item.quantidade;
      const mais = document.createElement("button");
      mais.type = "button"; mais.textContent = "+"; mais.setAttribute("aria-label", `Aumentar ${item.nome}`);
      mais.addEventListener("click", () => alterarQuantidade(item.lineId, 1));
      controles.append(menos, quantidade, mais);
      info.append(nome, detalhes, controles);
      const remover = document.createElement("button");
      remover.type = "button"; remover.className = "remover-item"; remover.textContent = "✕";
      remover.setAttribute("aria-label", `Remover ${item.nome}`);
      remover.addEventListener("click", () => removerItem(item.lineId));
      linha.append(emoji, info, remover);
      itensCarrinho.appendChild(linha);
    });

    const subtotal = carrinho.reduce((soma, item) => soma + (item.precoUnitario || item.preco) * item.quantidade, 0);
    subtotalEl.textContent = formatarPreco(subtotal);
    totalEl.textContent = formatarPreco(subtotal);
  }

  function alterarQuantidade(lineId, variacao) {
    const item = carrinho.find(produto => produto.lineId === lineId);
    if (!item) return;
    item.quantidade += variacao;
    if (item.quantidade <= 0) carrinho = carrinho.filter(produto => produto.lineId !== lineId);
    salvarCarrinho();
    renderizarCarrinho();
  }

  function removerItem(lineId) {
    carrinho = carrinho.filter(item => item.lineId !== lineId);
    salvarCarrinho();
    renderizarCarrinho();
  }

  botaoContinuar.addEventListener("click", () => {
    const emailLogado = localStorage.getItem("clienteLogado");
    if (!emailLogado) {
      localStorage.setItem("destinoAposLogin", "carrinho.html");
      window.location.href = "login.html";
      return;
    }
    window.location.href = "checkout.html";
  });

  renderizarCarrinho();
}

atualizarContador();

// Cadastro e autenticação demonstrativos no próprio navegador.
function lerClientes() {
  try { return JSON.parse(localStorage.getItem("clientesRaizes")) || []; }
  catch { return []; }
}

function mostrarMensagem(elemento, texto, tipo) {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.className = `mensagem-formulario ${tipo || ""}`;
}

const formCadastro = document.getElementById("formCadastro");
if (formCadastro) {
  formCadastro.addEventListener("submit", evento => {
    evento.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const telefone = document.getElementById("telefone").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;
    const aceitouPrivacidade = document.getElementById("aceitePrivacidade")?.checked;
    const mensagem = document.getElementById("mensagemCadastro");

    if (!nome || !email || !telefone || !senha || !confirmarSenha) {
      mostrarMensagem(mensagem, "Preencha todos os campos.", "erro"); return;
    }
    if (!aceitouPrivacidade) { mostrarMensagem(mensagem, "Leia e aceite o aviso de privacidade para continuar.", "erro"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mostrarMensagem(mensagem, "Informe um e-mail válido.", "erro"); return;
    }
    if (senha.length < 6) {
      mostrarMensagem(mensagem, "A senha deve ter pelo menos 6 caracteres.", "erro"); return;
    }
    if (senha !== confirmarSenha) {
      mostrarMensagem(mensagem, "As senhas não conferem.", "erro"); return;
    }

    const clientes = lerClientes();
    if (clientes.some(cliente => cliente.email === email)) {
      mostrarMensagem(mensagem, "Já existe uma conta cadastrada com esse e-mail.", "erro"); return;
    }

    // Em produção, senhas devem ser tratadas no servidor com hash seguro.
    clientes.push({ nome, email, telefone, senha, aceitePrivacidade: true, dataAceitePrivacidade: new Date().toISOString() });
    localStorage.setItem("clientesRaizes", JSON.stringify(clientes));
    localStorage.setItem("clienteLogado", email);
    mostrarMensagem(mensagem, "Cadastro realizado! Redirecionando para sua conta...", "sucesso");
    formCadastro.reset();
    setTimeout(() => { window.location.href = "conta.html"; }, 700);
  });
}

const formLogin = document.getElementById("formLogin");
if (formLogin) {
  formLogin.addEventListener("submit", evento => {
    evento.preventDefault();
    const email = document.getElementById("emailLogin").value.trim().toLowerCase();
    const senha = document.getElementById("senhaLogin").value;
    const mensagem = document.getElementById("mensagemLogin");
    const cliente = lerClientes().find(item => item.email === email && item.senha === senha);

    if (!cliente) {
      mostrarMensagem(mensagem, "E-mail ou senha incorretos. Confira os dados ou faça seu cadastro.", "erro"); return;
    }
    localStorage.setItem("clienteLogado", cliente.email);
    mostrarMensagem(mensagem, "Login realizado com sucesso!", "sucesso");
    const destino = localStorage.getItem("destinoAposLogin") || "conta.html";
    localStorage.removeItem("destinoAposLogin");
    setTimeout(() => { window.location.href = destino; }, 500);
  });
}

const areaLogada = document.getElementById("areaLogada");
if (areaLogada) {
  const emailLogado = localStorage.getItem("clienteLogado");
  const cliente = lerClientes().find(item => item.email === emailLogado);
  const areaVisitante = document.getElementById("areaVisitante");
  if (cliente) {
    areaLogada.hidden = false;
    areaVisitante.hidden = true;
    document.getElementById("saudacaoCliente").textContent = `Olá, ${cliente.nome.split(" ")[0]}!`;
    document.getElementById("contaNome").textContent = cliente.nome;
    document.getElementById("contaEmail").textContent = cliente.email;
    document.getElementById("contaTelefone").textContent = cliente.telefone;
    document.getElementById("botaoSair").addEventListener("click", () => {
      localStorage.removeItem("clienteLogado");
      window.location.href = "conta.html";
    });
  } else {
    areaLogada.hidden = true;
    areaVisitante.hidden = false;
  }
}


// Tela de personalização do produto.
const areaPersonalizacao = document.getElementById("areaPersonalizacao");
if (areaPersonalizacao) {
  const params = new URLSearchParams(window.location.search);
  const produto = produtos.find(item => item.id === Number(params.get("id")));
  const unidade = localStorage.getItem("unidadeSelecionada");
  const mensagem = document.getElementById("mensagemProduto");
  const opcoes = {
    1: [{ nome: "Porção de macaxeira", preco: 5 }, { nome: "Farofa da casa", preco: 3 }, { nome: "Vinagrete", preco: 2 }],
    2: [{ nome: "Queijo extra", preco: 3 }, { nome: "Carne extra", preco: 4 }, { nome: "Molho da casa", preco: 2 }],
    3: [{ nome: "Calda de chocolate", preco: 3 }, { nome: "Fatia com sorvete", preco: 6 }],
    4: [{ nome: "Gelo", preco: 0 }, { nome: "Adoçante", preco: 0 }, { nome: "Dose extra de fruta", preco: 3 }],
    5: [{ nome: "Queijo coalho", preco: 4 }, { nome: "Carne de sol", preco: 7 }, { nome: "Manteiga da terra", preco: 2 }],
    6: [{ nome: "Catupiry", preco: 3 }, { nome: "Molho da casa", preco: 2 }]
  };

  if (!produto) {
    areaPersonalizacao.innerHTML = '<div class="carrinho-vazio"><strong>Produto não encontrado.</strong><p>Volte ao cardápio e escolha outro item.</p><a class="link-voltar" href="index.html">Voltar ao cardápio</a></div>';
  } else {
    document.getElementById("produtoEmoji").textContent = produto.imagem;
    document.getElementById("produtoNome").textContent = produto.nome;
    document.getElementById("produtoDescricao").textContent = produto.descricao;
    document.getElementById("produtoPrecoBase").textContent = formatarPreco(produto.preco);
    const listaAdicionais = document.getElementById("listaAdicionais");
    const adicionaisProduto = Array.isArray(produto.adicionais) ? produto.adicionais : (opcoes[produto.id] || []);
    adicionaisProduto.forEach((adicional, indice) => {
      const label = document.createElement("label");
      label.className = "opcao-adicional";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox"; checkbox.value = String(indice); checkbox.dataset.preco = String(adicional.preco);
      const nome = document.createElement("span"); nome.textContent = adicional.nome;
      const valor = document.createElement("strong"); valor.textContent = adicional.preco ? `+ ${formatarPreco(adicional.preco)}` : "Grátis";
      label.append(checkbox, nome, valor); listaAdicionais.appendChild(label);
      checkbox.addEventListener("change", atualizarPreco);
    });

    function atualizarPreco() {
      const extras = [...listaAdicionais.querySelectorAll("input:checked")].reduce((total, campo) => total + Number(campo.dataset.preco), 0);
      document.getElementById("produtoPrecoFinal").textContent = formatarPreco(produto.preco + extras);
    }

    document.getElementById("botaoAdicionarPersonalizado").addEventListener("click", () => {
      if (!unidade) {
        mostrarMensagem(mensagem, "Volte ao cardápio e selecione uma unidade antes de adicionar o produto.", "erro");
        return;
      }
      const selecionados = [...listaAdicionais.querySelectorAll("input:checked")].map(campo => {
        const adicional = adicionaisProduto[Number(campo.value)];
        return { nome: adicional.nome, preco: adicional.preco };
      });
      const extras = selecionados.reduce((total, item) => total + item.preco, 0);
      const quantidade = Math.max(1, Math.min(20, Number(document.getElementById("quantidadeProduto").value) || 1));
      const observacao = document.getElementById("observacaoProduto").value.trim();
      carrinho.push({
        ...produto,
        lineId: `linha-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        precoUnitario: produto.preco + extras,
        adicionaisSelecionados: selecionados,
        observacao,
        quantidade,
        unidade
      });
      salvarCarrinho();
      mostrarMensagem(mensagem, "Produto personalizado e adicionado ao carrinho!", "sucesso");
      setTimeout(() => { window.location.href = "carrinho.html"; }, 650);
    });
    atualizarPreco();
  }
}

// O atalho Conta abre a área do cliente em todas as páginas.
const linkConta = document.getElementById("linkConta");
if (linkConta) linkConta.href = "conta.html";


// ETAPA 7 — Programa de fidelidade demonstrativo.
function lerCarteirasPontos() { try { return JSON.parse(localStorage.getItem("carteirasPontosRaizes")) || {}; } catch { return {}; } }
function saldoPontos(email) { return Number(lerCarteirasPontos()[email]?.saldo || 0); }
function registrarMovimentoPontos(email, quantidade, descricao, pedido) {
  const carteiras = lerCarteirasPontos();
  const carteira = carteiras[email] || { saldo: 0, historico: [] };
  carteira.saldo = Math.max(0, carteira.saldo + quantidade);
  carteira.historico.unshift({ quantidade, descricao, pedido, data: new Date().toLocaleString("pt-BR") });
  carteiras[email] = carteira;
  localStorage.setItem("carteirasPontosRaizes", JSON.stringify(carteiras));
}
const saldoPontosConta = document.getElementById("saldoPontosConta");
if (saldoPontosConta) saldoPontosConta.textContent = `${saldoPontos(localStorage.getItem("clienteLogado"))} pontos`;
const saldoPontosCarteira = document.getElementById("saldoPontosCarteira");
if (saldoPontosCarteira) {
  const email = localStorage.getItem("clienteLogado");
  if (!email) { window.location.href = "login.html"; }
  else {
    const carteiras = lerCarteirasPontos(); const carteira = carteiras[email] || { saldo: 0, historico: [] };
    saldoPontosCarteira.textContent = carteira.saldo;
    const historico = document.getElementById("historicoPontos");
    if (!carteira.historico.length) historico.innerHTML = '<div class="carrinho-vazio"><strong>Você ainda não possui movimentações.</strong><p>Seus pontos aparecerão aqui após compras aprovadas.</p></div>';
    else carteira.historico.forEach(m => { const item = document.createElement("article"); item.className = "admin-item"; const texto = document.createElement("span"); texto.textContent = `${m.descricao} · ${m.data}${m.pedido ? ` · ${m.pedido}` : ""}`; const valor = document.createElement("strong"); valor.textContent = `${m.quantidade > 0 ? "+" : ""}${m.quantidade} pts`; item.append(texto, valor); historico.append(item); });
  }
}

// Checkout e pagamento demonstrativo (sem transação financeira real).
const formularioCheckout = document.getElementById("formCheckout");
if (formularioCheckout) {
  const emailLogado = localStorage.getItem("clienteLogado");
  const cliente = lerClientes().find(item => item.email === emailLogado);
  const itens = lerCarrinho();
  const resumoCheckout = document.getElementById("resumoCheckout");
  const totalCheckout = document.getElementById("totalCheckout");
  const mensagemCheckout = document.getElementById("mensagemCheckout");
  const detalhesPix = document.getElementById("detalhesPix");
  const metodoPix = document.getElementById("metodoPix");
  const metodoCartao = document.getElementById("metodoCartao");

  if (!cliente) {
    localStorage.setItem("destinoAposLogin", "checkout.html");
    window.location.href = "login.html";
  } else if (!itens.length) {
    resumoCheckout.innerHTML = '<p>Seu carrinho está vazio. <a href="index.html">Voltar ao cardápio</a>.</p>';
    formularioCheckout.hidden = true;
  } else {
    const subtotal = itens.reduce((soma, item) => soma + Number(item.precoUnitario || item.preco) * Number(item.quantidade), 0);
    const pontosAtuais = saldoPontos(cliente.email);
    const usarPontos = document.getElementById("usarPontos");
    const descontoEl = document.getElementById("descontoPontosCheckout");
    document.getElementById("subtotalCheckout").textContent = formatarPreco(subtotal);
    document.getElementById("pontosDisponiveisCheckout").textContent = pontosAtuais;
    let pontosUsados = 0, descontoPontos = 0, descontoCupom = 0, cupomAplicado = "";
    const campoCupom = document.getElementById("codigoCupom"), botaoCupom = document.getElementById("aplicarCupom");
    const mensagemCupom = document.getElementById("mensagemCupom"), descontoCupomEl = document.getElementById("descontoCupomCheckout");
    function recalcularTotalCheckout() {
      const limitePontos = Math.max(0, subtotal - descontoCupom) * 0.10;
      pontosUsados = usarPontos.checked ? Math.min(pontosAtuais, Math.floor(limitePontos * 100)) : 0;
      descontoPontos = pontosUsados / 100;
      descontoEl.textContent = `Desconto: ${formatarPreco(descontoPontos)} (${pontosUsados} pontos)`;
      totalCheckout.textContent = formatarPreco(Math.max(0, subtotal - descontoCupom - descontoPontos));
    }
    if (botaoCupom && campoCupom && mensagemCupom && descontoCupomEl) botaoCupom.addEventListener("click", () => {
      const codigo = campoCupom.value.trim().toUpperCase(); let promocoes = [];
      try { promocoes = JSON.parse(localStorage.getItem("promocoesRaizes") || "[]"); } catch {}
      const promocao = promocoes.find(p => p.cupom && String(p.cupom).toUpperCase() === codigo && (p.unidade === itens[0].unidade || p.unidade === "todas") && Number.isInteger(Number(p.desconto)) && Number(p.desconto) >= 1 && Number(p.desconto) <= 90);
      if (!codigo || !promocao || !Number.isFinite(Number(promocao.desconto)) || Number(promocao.desconto) <= 0) {
        descontoCupom = 0; cupomAplicado = ""; mostrarMensagem(mensagemCupom, "Cupom inválido ou não disponível para esta unidade.", "erro");
      } else {
        descontoCupom = Math.round((subtotal * Number(promocao.desconto) / 100) * 100) / 100; cupomAplicado = codigo;
        mostrarMensagem(mensagemCupom, `Cupom ${codigo} aplicado: ${promocao.desconto}% de desconto.`, "sucesso");
      }
      descontoCupomEl.textContent = `Desconto do cupom: ${formatarPreco(descontoCupom)}`; recalcularTotalCheckout();
    });
    usarPontos.addEventListener("change", recalcularTotalCheckout); recalcularTotalCheckout();
    document.getElementById("clienteCheckout").textContent = `${cliente.nome} · ${cliente.email}`;
    resumoCheckout.replaceChildren();
    itens.forEach(item => {
      const linha = document.createElement("p");
      linha.textContent = `${item.quantidade} × ${item.nome} — ${formatarPreco((item.precoUnitario || item.preco) * item.quantidade)}`;
      resumoCheckout.appendChild(linha);
    });
    const unidade = itens[0].unidade === "centro" ? "Unidade Centro" : "Unidade Praia";
    document.getElementById("unidadeCheckout").textContent = unidade;

    function atualizarMetodo() {
      detalhesPix.hidden = !metodoPix.checked;
    }
    metodoPix.addEventListener("change", atualizarMetodo);
    metodoCartao.addEventListener("change", atualizarMetodo);
    atualizarMetodo();

    formularioCheckout.addEventListener("submit", evento => {
      evento.preventDefault();
      const metodo = document.querySelector('input[name="metodoPagamento"]:checked')?.value;
      const resultado = document.getElementById("resultadoSimulado").value;
      recalcularTotalCheckout();
      const totalFinal = Math.max(0, subtotal - descontoCupom - descontoPontos);
      if (!metodo) {
        mostrarMensagem(mensagemCheckout, "Escolha Pix ou cartão para continuar.", "erro");
        return;
      }
      if (resultado === "recusado") {
        const pendente = {
          codigo: `RN-${Date.now().toString().slice(-7)}`,
          email: cliente.email,
          unidade,
          metodo,
          total: totalFinal,
          subtotal,
          descontoPontos,
          descontoCupom,
          cupom: cupomAplicado,
          pontosUsados,
          status: "Aguardando pagamento",
          criadoEm: new Date().toLocaleString("pt-BR")
        };
        localStorage.setItem("ultimoPedidoPendente", JSON.stringify(pendente));
        mostrarMensagem(mensagemCheckout, "Pagamento não aprovado na simulação. Seu carrinho foi preservado. Você pode tentar novamente e escolher Pix ou cartão.", "erro");
        return;
      }

      const pedido = {
        codigo: `RN-${Date.now().toString().slice(-7)}`,
        email: cliente.email,
        cliente: cliente.nome,
        unidade,
        metodo,
        total: totalFinal,
        subtotal,
        descontoPontos,
        descontoCupom,
        cupom: cupomAplicado,
        pontosUsados,
        itens,
        status: "Pagamento confirmado",
        criadoEm: new Date().toLocaleString("pt-BR")
      };
      const pedidos = JSON.parse(localStorage.getItem("pedidosRaizes") || "[]");
      pedidos.push(pedido);
      localStorage.setItem("pedidosRaizes", JSON.stringify(pedidos));
      if (pontosUsados > 0) registrarMovimentoPontos(cliente.email, -pontosUsados, "Pontos utilizados no pedido", pedido.codigo);
      const pontosGanhos = Math.floor(totalFinal);
      if (pontosGanhos > 0) registrarMovimentoPontos(cliente.email, pontosGanhos, "Pontos ganhos na compra", pedido.codigo);
      pedido.pontosGanhos = pontosGanhos;
      pedidos[pedidos.length - 1] = pedido;
      localStorage.setItem("pedidosRaizes", JSON.stringify(pedidos));
      localStorage.setItem("ultimoPedidoRaizes", JSON.stringify(pedido));
      localStorage.removeItem("ultimoPedidoPendente");
      localStorage.removeItem("carrinho");
      window.location.href = "confirmacao.html";
    });
  }
}

// Exibição do pedido confirmado.
const areaConfirmacao = document.getElementById("areaConfirmacao");
if (areaConfirmacao) {
  let pedido = null;
  try { pedido = JSON.parse(localStorage.getItem("ultimoPedidoRaizes")); } catch {}
  if (!pedido) {
    areaConfirmacao.innerHTML = '<h2>Nenhum pedido confirmado nesta sessão.</h2><p><a href="index.html">Voltar ao cardápio</a></p>';
  } else {
    document.getElementById("codigoPedido").textContent = pedido.codigo;
    document.getElementById("statusPedido").textContent = pedido.status;
    document.getElementById("totalPedidoConfirmado").textContent = formatarPreco(pedido.total);
    document.getElementById("metodoPedidoConfirmado").textContent = pedido.metodo === "pix" ? "Pix (simulado)" : "Cartão (simulado)";
    document.getElementById("unidadePedidoConfirmado").textContent = pedido.unidade;
  }
}


// ETAPA 5 — ACOMPANHAMENTO DO PEDIDO E PAINEL DA COZINHA (simulação local).
const ETAPAS_PEDIDO = [
  "Pedido recebido",
  "Pagamento confirmado",
  "Em preparação",
  "Pronto para retirada",
  "Entregue"
];
function lerPedidos() {
  try { return JSON.parse(localStorage.getItem("pedidosRaizes")) || []; }
  catch { return []; }
}
function salvarPedidos(pedidos) {
  localStorage.setItem("pedidosRaizes", JSON.stringify(pedidos));
}
function indiceStatus(status) {
  const indice = ETAPAS_PEDIDO.indexOf(status);
  return indice < 0 ? 1 : indice;
}

// Área do cliente: lista e acompanha os próprios pedidos.
const listaMeusPedidos = document.getElementById("listaMeusPedidos");
if (listaMeusPedidos) {
  const email = localStorage.getItem("clienteLogado");
  const pedidosCliente = lerPedidos().filter(p => p.email === email).sort((a,b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
  if (!email) {
    listaMeusPedidos.innerHTML = '<div class="carrinho-vazio"><strong>Entre na sua conta para acompanhar seus pedidos.</strong><a class="botao-principal link-botao" href="login.html">Fazer login</a></div>';
  } else if (!pedidosCliente.length) {
    listaMeusPedidos.innerHTML = '<div class="carrinho-vazio"><strong>Você ainda não tem pedidos.</strong><p>Quando finalizar uma compra, ela aparecerá aqui.</p><a class="botao-principal link-botao" href="index.html">Explorar cardápio</a></div>';
  } else {
    pedidosCliente.forEach(pedido => {
      const card = document.createElement('article');
      card.className = 'pedido-cliente-card';
      const topo = document.createElement('div'); topo.className = 'pedido-cliente-topo';
      const codigo = document.createElement('strong'); codigo.textContent = pedido.codigo;
      const status = document.createElement('span'); status.className = 'status-pedido'; status.textContent = pedido.status;
      topo.append(codigo, status);
      const meta = document.createElement('p'); meta.textContent = `${pedido.unidade} · ${pedido.criadoEm || ''}`;
      const total = document.createElement('strong'); total.className = 'pedido-total'; total.textContent = formatarPreco(pedido.total);
      const link = document.createElement('a'); link.className = 'botao-principal link-botao'; link.href = `acompanhar.html?codigo=${encodeURIComponent(pedido.codigo)}`; link.textContent = 'Acompanhar pedido';
      card.append(topo, meta, total, link); listaMeusPedidos.append(card);
    });
  }
}

// Tela de acompanhamento individual; atualize a página para consultar mudanças feitas pela cozinha.
const areaAcompanhamento = document.getElementById('areaAcompanhamento');
if (areaAcompanhamento) {
  const codigo = new URLSearchParams(location.search).get('codigo');
  const email = localStorage.getItem('clienteLogado');
  const pedido = lerPedidos().find(p => p.codigo === codigo && p.email === email);
  if (!pedido) {
    areaAcompanhamento.innerHTML = '<div class="carrinho-vazio"><strong>Pedido não encontrado.</strong><p>Confira se entrou na conta usada para fazer o pedido.</p><a class="link-voltar" href="pedidos.html">Voltar aos meus pedidos</a></div>';
  } else {
    document.getElementById('acompanharCodigo').textContent = pedido.codigo;
    document.getElementById('acompanharUnidade').textContent = pedido.unidade;
    document.getElementById('acompanharStatus').textContent = pedido.status;
    document.getElementById('acompanharAtualizacao').textContent = pedido.atualizadoEm ? `Última atualização: ${pedido.atualizadoEm}` : `Pedido criado em: ${pedido.criadoEm}`;
    const lista = document.getElementById('linhaTempoPedido');
    const atual = indiceStatus(pedido.status);
    ETAPAS_PEDIDO.forEach((etapa, i) => {
      const item = document.createElement('li');
      item.className = i < atual ? 'etapa concluida' : (i === atual ? 'etapa atual' : 'etapa');
      const marcador = document.createElement('span'); marcador.className = 'etapa-marcador'; marcador.textContent = i < atual ? '✓' : String(i+1);
      const texto = document.createElement('span'); texto.textContent = etapa;
      item.append(marcador, texto); lista.append(item);
    });
    const itens = document.getElementById('itensAcompanhamento');
    (pedido.itens || []).forEach(item => {
      const linha = document.createElement('p');
      linha.textContent = `${item.quantidade} × ${item.nome}`;
      itens.append(linha);
    });
  }
}

// Painel da cozinha/atendimento: ambiente demonstrativo compartilhado neste navegador.
const quadroCozinha = document.getElementById('quadroCozinha');
if (quadroCozinha) {
  const seletor = document.getElementById('filtroUnidadeCozinha');
  const aviso = document.getElementById('avisoCozinha');
  function renderizarCozinha() {
    const unidadeFiltro = seletor.value;
    const pedidos = lerPedidos().filter(p => !unidadeFiltro || p.unidade === unidadeFiltro)
      .sort((a,b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
    quadroCozinha.replaceChildren();
    if (!pedidos.length) {
      quadroCozinha.innerHTML = '<div class="carrinho-vazio"><strong>Nenhum pedido confirmado por enquanto.</strong><p>Os pedidos aprovados na simulação aparecerão aqui.</p></div>';
      return;
    }
    pedidos.forEach(pedido => {
      const card = document.createElement('article'); card.className = 'pedido-cozinha-card';
      const topo = document.createElement('div'); topo.className = 'pedido-cliente-topo';
      const titulo = document.createElement('strong'); titulo.textContent = pedido.codigo;
      const status = document.createElement('span'); status.className = 'status-pedido'; status.textContent = pedido.status;
      topo.append(titulo, status);
      const cliente = document.createElement('p'); cliente.textContent = `Cliente: ${pedido.cliente || pedido.email}`;
      const unidade = document.createElement('p'); unidade.textContent = `Unidade: ${pedido.unidade}`;
      const total = document.createElement('p'); total.textContent = `Total: ${formatarPreco(pedido.total)}`;
      const lista = document.createElement('ul'); lista.className = 'itens-cozinha';
      (pedido.itens || []).forEach(prod => {
        const li = document.createElement('li');
        const extras = (prod.adicionaisSelecionados || []).map(x => x.nome).join(', ');
        li.textContent = `${prod.quantidade} × ${prod.nome}${extras ? ` — ${extras}` : ''}${prod.observacao ? ` (Obs.: ${prod.observacao})` : ''}`;
        lista.append(li);
      });
      const acoes = document.createElement('div'); acoes.className = 'acoes-cozinha';
      const idx = indiceStatus(pedido.status);
      const botao = document.createElement('button'); botao.type = 'button'; botao.className = 'botao-principal';
      if (idx >= ETAPAS_PEDIDO.length - 1) { botao.textContent = 'Pedido entregue'; botao.disabled = true; }
      else { botao.dataset.avancarPedido = pedido.codigo; botao.textContent = `Avançar para: ${ETAPAS_PEDIDO[idx+1]}`; }
      acoes.append(botao);
      card.append(topo, cliente, unidade, total, lista, acoes);
      quadroCozinha.append(card);
    });
  }
  seletor.addEventListener('change', renderizarCozinha);
  quadroCozinha.addEventListener('click', evento => {
    const botao = evento.target.closest('[data-avancar-pedido]');
    if (!botao) return;
    const pedidos = lerPedidos();
    const pedido = pedidos.find(p => p.codigo === botao.dataset.avancarPedido);
    if (!pedido) return;
    const proximo = indiceStatus(pedido.status) + 1;
    if (proximo >= ETAPAS_PEDIDO.length) return;
    pedido.status = ETAPAS_PEDIDO[proximo];
    pedido.atualizadoEm = new Date().toLocaleString('pt-BR');
    salvarPedidos(pedidos);
    mostrarMensagem(aviso, `Pedido ${pedido.codigo} atualizado: ${pedido.status}.`, 'sucesso');
    renderizarCozinha();
  });
  renderizarCozinha();
}


// Painel administrativo demonstrativo: catálogo, promoções e indicadores por unidade.
const painelAdmin = document.getElementById("painelAdmin");
if (painelAdmin) {
  const unidadeSelect = document.getElementById("unidadeAdmin");
  const form = document.getElementById("formProdutoAdmin");
  const lista = document.getElementById("listaAdminProdutos");
  const mensagem = document.getElementById("mensagemAdmin");
  const promoForm = document.getElementById("formPromocaoAdmin");
  const promoLista = document.getElementById("listaPromocoesAdmin");
  let editandoId = null;
  const lerPromocoes = () => { try { return JSON.parse(localStorage.getItem("promocoesRaizes")) || []; } catch { return []; } };
  const salvarPromocoes = itens => localStorage.setItem("promocoesRaizes", JSON.stringify(itens));
  const linhasAdicionais = document.getElementById("linhasAdicionaisAdmin");
  const botaoAdicionarAdicional = document.getElementById("adicionarLinhaAdicional");
  function criarLinhaAdicional(nome = "", preco = "") {
    const linha = document.createElement("div"); linha.className = "admin-item linha-adicional"; linha.style.flexWrap = "wrap";
    const campoNome = document.createElement("input"); campoNome.type = "text"; campoNome.placeholder = "Ingrediente extra (ex.: queijo)"; campoNome.maxLength = 60; campoNome.value = nome; campoNome.setAttribute("aria-label", "Nome do ingrediente extra"); campoNome.style.flex = "2 1 180px";
    const campoPreco = document.createElement("input"); campoPreco.type = "number"; campoPreco.min = "0"; campoPreco.step = "0.01"; campoPreco.placeholder = "Preço (R$)"; campoPreco.value = preco; campoPreco.setAttribute("aria-label", "Preço do ingrediente extra"); campoPreco.style.flex = "1 1 110px";
    const remover = document.createElement("button"); remover.type = "button"; remover.className = "botao-secundario"; remover.textContent = "Remover"; remover.addEventListener("click", () => linha.remove());
    linha.append(campoNome, campoPreco, remover); linhasAdicionais.append(linha);
  }
  botaoAdicionarAdicional.addEventListener("click", () => criarLinhaAdicional());
  function lerAdicionaisDoFormulario() {
    const adicionais = [];
    for (const linha of linhasAdicionais.querySelectorAll(".linha-adicional")) {
      const campos = linha.querySelectorAll("input"), nome = campos[0].value.trim(), precoTexto = campos[1].value;
      if (!nome && !precoTexto) continue;
      const preco = Number(precoTexto);
      if (!nome || precoTexto === "" || !Number.isFinite(preco) || preco < 0) throw new Error("Preencha o nome e um preço válido para cada ingrediente extra.");
      adicionais.push({ nome, preco });
    }
    return adicionais;
  }
  function preencherAdicionaisFormulario(adicionais = []) {
    linhasAdicionais.replaceChildren(); (Array.isArray(adicionais) ? adicionais : []).forEach(item => criarLinhaAdicional(item.nome, item.preco));
  }
  const nomeUnidade = v => v === "centro" ? "Unidade Centro" : "Unidade Praia";
  function renderAdmin() {
    const unidade = unidadeSelect.value;
    const meusProdutos = produtos.filter(p => !p.unidade || p.unidade === "todas" || p.unidade === unidade);
    lista.replaceChildren();
    meusProdutos.forEach(prod => {
      const card = document.createElement("article"); card.className = "admin-item";
      const info = document.createElement("div");
      const nome = document.createElement("strong"); nome.textContent = `${prod.imagem || "🍽️"} ${prod.nome}`;
      const quantidadeExtras = Array.isArray(prod.adicionais) ? prod.adicionais.length : 0;
      const detalhe = document.createElement("p"); detalhe.textContent = `${prod.categoria} · ${formatarPreco(Number(prod.preco))} · ${quantidadeExtras} adicional(is) · ${prod.disponivel === false ? "Indisponível" : "Disponível"}`;
      info.append(nome, detalhe);
      const acoes = document.createElement("div"); acoes.className = "admin-acoes";
      const editar = document.createElement("button"); editar.className = "botao-secundario"; editar.textContent = "Editar";
      editar.addEventListener("click", () => {
        editandoId = prod.id;
        form.elements.nome.value = prod.nome; form.elements.descricao.value = prod.descricao;
        form.elements.preco.value = prod.preco; form.elements.categoria.value = prod.categoria;
        form.elements.imagem.value = prod.imagem || "🍽️"; form.elements.disponivel.checked = prod.disponivel !== false;
        form.elements.unidadeProduto.value = prod.unidade || unidade;
        preencherAdicionaisFormulario(prod.adicionais || []);
        form.querySelector("button[type=submit]").textContent = "Salvar alterações";
        form.scrollIntoView({behavior:"smooth",block:"start"});
      });
      const alternar = document.createElement("button"); alternar.className = "botao-secundario"; alternar.textContent = prod.disponivel === false ? "Ativar" : "Indisponibilizar";
      alternar.addEventListener("click", () => { prod.disponivel = prod.disponivel === false; salvarCatalogo(); renderAdmin(); });
      acoes.append(editar, alternar); card.append(info, acoes); lista.append(card);
    });
    const pedidos = lerPedidos().filter(p => p.unidade === nomeUnidade(unidade));
    const totalVendido = pedidos.filter(p => p.status === "Entregue").reduce((s,p) => s + Number(p.total || 0), 0);
    document.getElementById("indicadorPedidos").textContent = pedidos.length;
    document.getElementById("indicadorVendas").textContent = formatarPreco(totalVendido);
    document.getElementById("indicadorProdutos").textContent = meusProdutos.length;
    renderPromocoes();
  }
  form.addEventListener("submit", evento => {
    evento.preventDefault();
    const dados = new FormData(form); let adicionais;
    try { adicionais = lerAdicionaisDoFormulario(); } catch (erro) { mostrarMensagem(mensagem, erro.message, "erro"); return; }
    const item = { id: editandoId || Date.now(), nome: String(dados.get("nome")).trim(), descricao: String(dados.get("descricao")).trim(), preco: Number(dados.get("preco")), categoria: String(dados.get("categoria")), imagem: String(dados.get("imagem")).trim() || "🍽️", unidade: String(dados.get("unidadeProduto")), disponivel: form.elements.disponivel.checked, adicionais };
    if (!item.nome || !Number.isFinite(item.preco) || item.preco <= 0) { mostrarMensagem(mensagem,"Informe nome e preço válido.","erro"); return; }
    if (editandoId) produtos = produtos.map(p => p.id === editandoId ? item : p); else produtos.push(item);
    salvarCatalogo(); editandoId = null; form.reset(); preencherAdicionaisFormulario([]); form.elements.unidadeProduto.value = unidadeSelect.value; form.querySelector("button[type=submit]").textContent = "Cadastrar produto";
    mostrarMensagem(mensagem,"Produto e ingredientes extras salvos no catálogo desta unidade.","sucesso"); renderAdmin();
  });
  promoForm.addEventListener("submit", evento => {
    evento.preventDefault(); const dados = new FormData(promoForm); const promos = lerPromocoes();
    const cupom = String(dados.get("cupom")).trim().toUpperCase();
    const desconto = Number(dados.get("desconto") || 0);
    if (cupom && (!Number.isInteger(desconto) || desconto < 1 || desconto > 90)) { alert("Informe um desconto inteiro entre 1% e 90% para o cupom."); return; }
    promos.push({id:Date.now(), titulo:String(dados.get("titulo")).trim(), descricao:String(dados.get("descricao")).trim(), unidade:unidadeSelect.value, cupom, desconto});
    salvarPromocoes(promos); promoForm.reset(); renderPromocoes();
  });
  function renderPromocoes() {
    promoLista.replaceChildren();
    lerPromocoes().filter(p => p.unidade === unidadeSelect.value).forEach(p => {
      const item = document.createElement("div"); item.className = "admin-item";
      const texto = document.createElement("span"); texto.textContent = `${p.titulo} — ${p.descricao}${p.cupom ? ` (Cupom: ${p.cupom} · ${p.desconto || 0}% OFF)` : ""}`;
      const remover = document.createElement("button"); remover.className = "botao-secundario"; remover.textContent = "Excluir";
      remover.addEventListener("click", () => { salvarPromocoes(lerPromocoes().filter(x => x.id !== p.id)); renderPromocoes(); });
      item.append(texto,remover); promoLista.append(item);
    });
  }
  unidadeSelect.addEventListener("change", () => { form.reset(); preencherAdicionaisFormulario([]); form.elements.unidadeProduto.value = unidadeSelect.value; editandoId=null; form.querySelector("button[type=submit]").textContent = "Cadastrar produto"; renderAdmin(); });
  form.elements.unidadeProduto.value = unidadeSelect.value;
  preencherAdicionaisFormulario([]);
  renderAdmin();
}
