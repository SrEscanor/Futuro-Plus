import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { integrarResultadoPendenteComPerfil } from "./resultado-teste.js";
import { localizarRuaDoAluno } from "./geocodificacao.js";
import { entrarComGoogle } from "./auth-google.js";

document.addEventListener('DOMContentLoaded', () => {
  const botaoGoogle = document.getElementById('btnGoogleCadastro');
  botaoGoogle.addEventListener('click', async () => {
    if (await entrarComGoogle(botaoGoogle)) {
      window.location.href = 'index.html';
    }
  });

  // ---------------------------------------------------------------
  // Leitura obrigatória dos termos: o aceite só libera depois que a
  // pessoa abre os dois documentos e rola cada um até o fim.
  // ---------------------------------------------------------------
  const modalLegal = document.getElementById('modal-legal');
  const modalLegalTitulo = document.getElementById('modal-legal-titulo');
  const modalLegalIframe = document.getElementById('modal-legal-iframe');
  const modalLegalAviso = document.getElementById('modal-legal-aviso');
  const modalLegalFechar = document.getElementById('modal-legal-fechar');
  const aceiteTermos = document.getElementById('aceiteTermos');
  const labelAceiteTermos = document.getElementById('label-aceite-termos');

  const lidos = { termos: false, privacidade: false };
  let docAberto = null;

  function atualizarLiberacaoDoAceite() {
    const tudoLido = lidos.termos && lidos.privacidade;
    aceiteTermos.disabled = !tudoLido;
    if (tudoLido) {
      labelAceiteTermos.innerHTML = 'Li e concordo com os <a href="termos-de-uso.html" target="_blank">Termos de Uso</a> e a <a href="privacidade.html" target="_blank">Política de Privacidade</a>.';
    }
  }

  function marcarComoLido(chave) {
    if (!chave || lidos[chave]) return;
    lidos[chave] = true;
    const idBotao = chave === 'termos' ? 'btn-ler-termos' : 'btn-ler-privacidade';
    const idStatus = chave === 'termos' ? 'status-termos' : 'status-privacidade';
    document.getElementById(idBotao).classList.add('btn-ler-termo--lido');
    document.getElementById(idStatus).textContent = '✓';
    if (docAberto === chave) {
      modalLegalAviso.textContent = 'Lido! Você já pode fechar.';
      modalLegalAviso.classList.add('lido');
    }
    atualizarLiberacaoDoAceite();
  }

  // Considera lido quando faltam menos de ~40px pra chegar no fim — evita
  // depender de rolar o pixel exato, o que varia por navegador/tela.
  function aoRolarIframe() {
    const janela = modalLegalIframe.contentWindow;
    const documentoIframe = modalLegalIframe.contentDocument;
    if (!janela || !documentoIframe?.documentElement) return;
    const faltam = documentoIframe.documentElement.scrollHeight - (janela.scrollY + janela.innerHeight);
    if (faltam < 40) marcarComoLido(docAberto);
  }

  function abrirModalLegal(chave, caminhoDoc, titulo) {
    docAberto = chave;
    modalLegalTitulo.textContent = titulo;
    modalLegalAviso.classList.remove('lido');
    modalLegalAviso.textContent = lidos[chave]
      ? 'Lido! Você já pode fechar.'
      : 'Role o texto até o fim para marcar como lido.';
    if (lidos[chave]) modalLegalAviso.classList.add('lido');
    modalLegalIframe.src = caminhoDoc;
    modalLegal.showModal();
  }

  document.getElementById('btn-ler-termos').addEventListener('click', (e) => {
    abrirModalLegal('termos', e.currentTarget.dataset.doc, e.currentTarget.dataset.titulo);
  });
  document.getElementById('btn-ler-privacidade').addEventListener('click', (e) => {
    abrirModalLegal('privacidade', e.currentTarget.dataset.doc, e.currentTarget.dataset.titulo);
  });

  modalLegalIframe.addEventListener('load', () => {
    try {
      modalLegalIframe.contentWindow.addEventListener('scroll', aoRolarIframe);
      // Documento curto o bastante pra caber sem rolar já conta como lido.
      aoRolarIframe();
    } catch (erro) {
      // Se o navegador bloquear o acesso ao conteúdo do iframe por algum
      // motivo, não trava o cadastro: libera como lido ao abrir.
      console.error('Erro ao observar o scroll do termo:', erro);
      marcarComoLido(docAberto);
    }
  });

  modalLegalFechar.addEventListener('click', () => modalLegal.close());
  modalLegal.addEventListener('click', (e) => {
    if (e.target === modalLegal) modalLegal.close();
  });

  const cepInput = document.getElementById('cep');
  const cpfInput = document.getElementById('cpf');
  const nomeInput = document.getElementById('nome');
  const sobrenomeInput = document.getElementById('sobrenome');
  const numeroInput = document.getElementById('numero');
  const formCadastro = document.getElementById('formCadastro');
  const msgErro = document.getElementById('msgErro');

  const wizardViewport = document.getElementById('wizardViewport');
  const wizardTrack = document.getElementById('wizardTrack');
  const stepper = document.getElementById('stepper');
  const heroSub = document.getElementById('heroSub');

  const TITULOS_ETAPA = {
    1: 'Informações básicas',
    2: 'Dados pessoais',
    3: 'Endereço'
  };

  let etapaAtual = 1;
  // Cidade devolvida pelo ViaCEP e a coordenada da rua (sem o número da
  // casa); usadas para recomendar as Etecs mais perto da pessoa. A busca da
  // coordenada começa assim que o CEP é preenchido, enquanto a pessoa segue
  // para os próximos campos.
  let cidadeDoCep = '';
  let buscaLocalizacao = Promise.resolve(null);

  // ---------------------------------------------------------------
  // Mensagens de erro
  // ---------------------------------------------------------------
  function mostrarErro(mensagem, campo) {
    if (msgErro) {
      msgErro.textContent = mensagem;
      msgErro.style.display = 'block';
    } else {
      alert(mensagem);
    }
    if (campo) {
      campo.classList.add('campo-invalido');
      campo.focus({ preventScroll: true });
    }
  }

  function limparErro() {
    if (msgErro) {
      msgErro.textContent = '';
      msgErro.style.display = 'none';
    }
    formCadastro.querySelectorAll('.campo-invalido')
      .forEach((el) => el.classList.remove('campo-invalido'));
  }

  function falhar(mensagem, campo) {
    mostrarErro(mensagem, campo);
    return false;
  }

  // ---------------------------------------------------------------
  // Navegação entre as etapas
  // ---------------------------------------------------------------
  function etapaElemento(numero) {
    return formCadastro.querySelector(`.wizard-etapa[data-etapa="${numero}"]`);
  }

  // A altura do slide ativo é aplicada no container para que a troca de etapa
  // anime em vez de saltar (cada etapa tem uma quantidade diferente de campos).
  function atualizarAlturaViewport() {
    const ativa = etapaElemento(etapaAtual);
    if (ativa && wizardViewport) {
      wizardViewport.style.height = `${ativa.offsetHeight}px`;
    }
  }

  function irParaEtapa(numero) {
    etapaAtual = numero;
    wizardTrack.dataset.etapa = String(numero);

    const ativa = etapaElemento(numero);

    formCadastro.querySelectorAll('.wizard-etapa').forEach((secao) => {
      secao.toggleAttribute('inert', secao !== ativa);
    });

    [...stepper.children].forEach((barra, indice) => {
      barra.classList.toggle('ativa', indice + 1 === numero);
      barra.classList.toggle('concluida', indice + 1 < numero);
    });

    heroSub.textContent = `Passo ${numero} de 3 — ${TITULOS_ETAPA[numero]}`;
    atualizarAlturaViewport();

    // preventScroll é essencial: sem ele o navegador rola o container do
    // wizard (que é overflow:hidden) para "revelar" o campo focado, e os
    // slides saem de alinhamento com o translateX.
    const primeiroCampo = ativa.querySelector('input, select');
    if (primeiroCampo) primeiroCampo.focus({ preventScroll: true });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------------------------------------------------------------
  // Validações
  // ---------------------------------------------------------------
  function normalizarCpf(cpf) {
    return cpf.replace(/\D/g, '');
  }

  // Versão atual do documento publicado em admin-termos.html (1 se ninguém
  // publicou nada ainda) — grava qual versão a pessoa aceitou no cadastro.
  async function buscarVersaoAtual(colecaoId) {
    try {
      const snap = await getDoc(doc(db, 'configuracoes', colecaoId));
      return snap.exists() && snap.data().versao ? snap.data().versao : 1;
    } catch {
      return 1;
    }
  }

  function validaCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }

  function verificaIdade(dataString) {
    const hoje = new Date();
    const nascimento = new Date(dataString);

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade >= 14;
  }

  function validarEtapa(numero) {
    limparErro();

    if (numero === 1) {
      const email = document.getElementById('email');
      const senha = document.getElementById('senha');
      const confirmaSenha = document.getElementById('confirmaSenha');

      if (!nomeInput.value.trim()) return falhar('Informe seu nome.', nomeInput);
      if (!sobrenomeInput.value.trim()) return falhar('Informe seu sobrenome.', sobrenomeInput);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        return falhar('Informe um e-mail válido.', email);
      }
      if (senha.value.length < 6) {
        return falhar('A senha deve ter pelo menos 6 caracteres.', senha);
      }
      if (senha.value !== confirmaSenha.value) {
        return falhar('As senhas não coincidem. Por favor, verifique.', confirmaSenha);
      }
      return true;
    }

    if (numero === 2) {
      const dataNascimento = document.getElementById('dataNascimento');
      const genero = document.getElementById('genero');

      if (!validaCPF(cpfInput.value)) {
        return falhar('CPF inválido. Por favor, verifique os números.', cpfInput);
      }
      if (!dataNascimento.value) {
        return falhar('Informe sua data de nascimento.', dataNascimento);
      }
      if (!verificaIdade(dataNascimento.value)) {
        return falhar('Cadastro não permitido. É necessário ter mais de 14 anos.', dataNascimento);
      }
      if (!genero.value) {
        return falhar('Selecione seu gênero.', genero);
      }
      return true;
    }

    if (numero === 3) {
      const rua = document.getElementById('rua');
      const estado = document.getElementById('estado');
      const aceiteTermos = document.getElementById('aceiteTermos');

      if (cepInput.value.replace(/\D/g, '').length !== 8) {
        return falhar('Informe um CEP válido (8 dígitos).', cepInput);
      }
      if (!rua.value.trim()) return falhar('Informe a rua / logradouro.', rua);
      if (!numeroInput.value.trim()) return falhar('Informe o número do endereço.', numeroInput);
      if (!estado.value.trim()) return falhar('Informe o estado (UF).', estado);
      if (!aceiteTermos.checked) {
        return falhar('É preciso aceitar os termos para criar a conta.');
      }
      return true;
    }

    return true;
  }

  // ---------------------------------------------------------------
  // Botões de navegação
  // ---------------------------------------------------------------
  formCadastro.addEventListener('click', (e) => {
    const avancar = e.target.closest('[data-avancar]');
    if (avancar) {
      if (validarEtapa(etapaAtual)) irParaEtapa(Number(avancar.dataset.avancar));
      return;
    }

    const voltar = e.target.closest('[data-voltar]');
    if (voltar) {
      limparErro();
      irParaEtapa(Number(voltar.dataset.voltar));
    }
  });

  // Enter em qualquer campo avança a etapa; na última etapa, cria a conta.
  // Tratamos a tecla no lugar do envio automático do navegador, que não
  // acontece quando o foco está num select.
  formCadastro.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (!['INPUT', 'SELECT'].includes(e.target.tagName)) return;

    e.preventDefault();

    if (etapaAtual === 3) {
      formCadastro.requestSubmit();
      return;
    }

    if (validarEtapa(etapaAtual)) irParaEtapa(etapaAtual + 1);
  });

  // ---------------------------------------------------------------
  // Máscaras e preenchimento automático
  // ---------------------------------------------------------------
  cpfInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    e.target.value = value;
  });

  // Avisa na hora se o CPF já tem conta, sem esperar o fim do cadastro. A
  // checagem definitiva (que reserva o CPF de verdade) acontece de novo no
  // envio, porque entre o blur e o clique em "Criar conta" outra pessoa pode
  // ter cadastrado o mesmo CPF primeiro.
  cpfInput.addEventListener('blur', async () => {
    if (!validaCPF(cpfInput.value)) return;
    try {
      const reservado = await getDoc(doc(db, 'cpfs_em_uso', normalizarCpf(cpfInput.value)));
      if (reservado.exists()) {
        mostrarErro('Este CPF já está cadastrado em outra conta.', cpfInput);
      }
    } catch (erro) {
      console.error('Erro ao checar CPF:', erro);
    }
  });

  [nomeInput, sobrenomeInput].forEach(input => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[0-9]/g, '');
    });
    input.addEventListener('blur', (e) => {
      let val = e.target.value.trim();
      if (val.length > 0) {
        e.target.value = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
      }
    });
  });

  numeroInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });

  cepInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    value = value.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = value;
  });

  cepInput.addEventListener('blur', async (e) => {
    let cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          document.getElementById('rua').value = data.logradouro;
          document.getElementById('estado').value = data.uf;
          cidadeDoCep = data.localidade || '';
          buscaLocalizacao = localizarRuaDoAluno({ rua: data.logradouro, cidade: data.localidade, uf: data.uf })
            .catch(() => null);
          limparErro();
        } else {
          cidadeDoCep = '';
          buscaLocalizacao = Promise.resolve(null);
          mostrarErro("CEP não encontrado.", cepInput);
        }
      } catch (error) {
        console.error("Erro na busca do CEP:", error);
      }
    }
  });

  // ---------------------------------------------------------------
  // Envio final
  // ---------------------------------------------------------------
  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Enter apertado de novo enquanto a conta ainda está sendo criada
    if (formCadastro.querySelector('button[type="submit"]').disabled) return;

    // Revalida tudo: se algo ficou inválido numa etapa anterior, volta pra ela.
    for (const etapa of [1, 2, 3]) {
      if (!validarEtapa(etapa)) {
        if (etapa !== etapaAtual) irParaEtapa(etapa);
        return;
      }
    }
    limparErro();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const botaoEnviar = formCadastro.querySelector('button[type="submit"]');

    try {
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = 'Criando conta...';

      // 1. Cria a conta de Autenticação no Firebase
      // Espera no máximo 3 s pela coordenada; se não vier, a conta é criada
      // sem ela e a primeira visita à home completa depois.
      const [localizacao, versaoTermos, versaoPrivacidade] = await Promise.all([
        Promise.race([buscaLocalizacao, new Promise((resolve) => setTimeout(() => resolve(null), 3000))]),
        buscarVersaoAtual('termos-de-uso'),
        buscarVersaoAtual('politica-privacidade')
      ]);

      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 2. Salva os dados complementares e reserva o CPF no mesmo lote: se o
      // CPF já tiver dono, a regra do Firestore recusa o lote inteiro (nada
      // fica gravado pela metade), e desfazemos a conta de Auth criada acima.
      const cpfNormalizado = normalizarCpf(cpfInput.value);
      try {
        const lote = writeBatch(db);
        lote.set(doc(db, "usuarios", user.uid), {
          nome: nomeInput.value,
          sobrenome: sobrenomeInput.value,
          cpf: cpfInput.value,
          email: email,
          dataNascimento: document.getElementById('dataNascimento').value,
          genero: document.getElementById('genero').value,
          cep: cepInput.value,
          rua: document.getElementById('rua').value,
          numero: numeroInput.value,
          estado: document.getElementById('estado').value,
          ...(cidadeDoCep ? { cidade: cidadeDoCep } : {}),
          ...(localizacao ? { localizacao } : {}),
          termosAceitos: { termos: versaoTermos, privacidade: versaoPrivacidade, aceitoEm: new Date().toISOString() },
          criadoEm: new Date().toISOString()
        });
        lote.set(doc(db, "cpfs_em_uso", cpfNormalizado), {
          uid: user.uid,
          criadoEm: new Date().toISOString()
        });
        await lote.commit();
      } catch (erroPerfil) {
        await deleteUser(user).catch((erroLimpeza) => console.error('Erro ao desfazer conta:', erroLimpeza));
        throw Object.assign(new Error('CPF já cadastrado'), { code: 'cpf-em-uso' });
      }

      // Se a pessoa fez o teste antes de criar a conta, vincula o resultado agora
      await integrarResultadoPendenteComPerfil(user.uid)
        .catch(erro => console.error("Erro ao vincular resultado do teste:", erro));

      alert("Cadastro realizado com sucesso!");
      window.location.href = "login.html";

    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      botaoEnviar.disabled = false;
      botaoEnviar.textContent = 'Criar conta';

      if (error.code === 'cpf-em-uso') {
        irParaEtapa(2);
        mostrarErro("Este CPF já está cadastrado em outra conta.", cpfInput);
      } else if (error.code === 'auth/email-already-in-use') {
        irParaEtapa(1);
        mostrarErro("Este e-mail já está cadastrado.", document.getElementById('email'));
      } else if (error.code === 'auth/weak-password') {
        irParaEtapa(1);
        mostrarErro("A senha deve ter pelo menos 6 caracteres.", document.getElementById('senha'));
      } else {
        mostrarErro("Erro ao cadastrar: " + error.message);
      }
    }
  });

  // ---------------------------------------------------------------
  // Estado inicial
  // ---------------------------------------------------------------
  atualizarAlturaViewport();
  window.addEventListener('resize', atualizarAlturaViewport);
  window.addEventListener('load', atualizarAlturaViewport);

  // O deslocamento entre etapas é feito só por translateX; qualquer rolagem
  // horizontal do container (o navegador provoca uma ao focar um campo fora
  // de vista) desalinha os slides, então desfazemos na hora.
  wizardViewport.addEventListener('scroll', () => {
    if (wizardViewport.scrollLeft !== 0) wizardViewport.scrollLeft = 0;
  });
});
