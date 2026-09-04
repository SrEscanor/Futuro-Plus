import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
  const cepInput = document.getElementById('cep');
  const cpfInput = document.getElementById('cpf');
  const nomeInput = document.getElementById('nome');
  const sobrenomeInput = document.getElementById('sobrenome');
  const numeroInput = document.getElementById('numero');
  const formCadastro = document.getElementById('formCadastro');
  const msgErro = document.getElementById('msgErro');

  function mostrarErro(mensagem) {
    if (msgErro) {
      msgErro.textContent = mensagem;
      msgErro.style.display = 'block';
      msgErro.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      alert(mensagem);
    }
  }

  function limparErro() {
    if (msgErro) {
      msgErro.textContent = '';
      msgErro.style.display = 'none';
    }
  }

  // Máscara automática de CPF: 000.000.000-00
  cpfInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');

    e.target.value = value;
  });

  // Formata Nome e Sobrenome (1ª letra maiúscula)
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

  if (numeroInput) {
    numeroInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
    });
  }

  // ViaCEP
  cepInput.addEventListener('blur', async (e) => {
    let cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          document.getElementById('rua').value = data.logradouro;
          document.getElementById('estado').value = data.uf;
          limparErro();
        } else {
          mostrarErro("CEP não encontrado.");
        }
      } catch (error) {
        console.error("Erro na busca do CEP:", error);
      }
    }
  });

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

  // Intercepta o Submit e cria o usuário no Firebase Auth
  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparErro();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmaSenha = document.getElementById('confirmaSenha').value;

    if (senha !== confirmaSenha) {
      mostrarErro("As senhas não coincidem. Por favor, verifique.");
      return;
    }

    if (!validaCPF(cpfInput.value)) {
      mostrarErro("CPF inválido. Por favor, verifique os números.");
      return;
    }

    const dataNascimento = document.getElementById('dataNascimento').value;
    if (!dataNascimento || !verificaIdade(dataNascimento)) {
      mostrarErro("Cadastro não permitido. É necessário ter mais de 14 anos.");
      return;
    }

    try {
      // 1. Cria a conta de Autenticação no Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 2. Salva os dados complementares no Firestore
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nomeInput.value,
        sobrenome: sobrenomeInput.value,
        cpf: cpfInput.value,
        email: email,
        dataNascimento: dataNascimento,
        genero: document.getElementById('genero').value,
        cep: cepInput.value,
        rua: document.getElementById('rua').value,
        numero: numeroInput.value,
        estado: document.getElementById('estado').value,
        criadoEm: new Date().toISOString()
      });

      alert("Cadastro realizado com sucesso!");
      window.location.href = "login.html";

    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      if (error.code === 'auth/email-already-in-use') {
        mostrarErro("Este e-mail já está cadastrado.");
      } else if (error.code === 'auth/weak-password') {
        mostrarErro("A senha deve ter pelo menos 6 caracteres.");
      } else {
        mostrarErro("Erro ao cadastrar: " + error.message);
      }
    }
  });
});