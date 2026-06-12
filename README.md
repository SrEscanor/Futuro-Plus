# FuturoPlus 🚀

O **FuturoPlus** é uma plataforma inteligente de gestão de carreira e qualificação profissional. Ele funciona como uma carteira digital e um guia de estudos personalizado, ajudando o usuário a documentar suas conquistas e planejar seus próximos passos no mercado de trabalho.

Desenvolvido com **Kotlin Multiplatform (KMP)** e **Compose Multiplatform**, o projeto oferece uma experiência fluida e nativa tanto no **Android** quanto no **iOS** a partir de uma única base de código. Agora, também contamos com uma interface Web desenvolvida em **JavaScript puro**.

---

## 🌟 Como Funciona

* **Guarde seus Diplomas:** O usuário centraliza e valida todos os seus certificados, diplomas e cursos já realizados em um único ambiente digital seguro.
* **Escolha seu Objetivo:** O usuário define a profissão ou a área de atuação onde deseja crescer ou fazer uma transição de carreira.
* **Descubra o Caminho:** O app analisa o perfil atual do usuário, identifica as habilidades que faltam e recomenda os melhores cursos disponíveis no mercado para aquela área específica.

## 🚀 Diferencial Competitivo

Em vez de apenas listar cursos genéricos, o **FuturoPlus** cruza os diplomas que o usuário já possui com as exigências do mercado, criando um cronograma de estudos sob medida, eficiente e focado em empregabilidade.

## 🛠️ Tecnologias Utilizadas

* **Kotlin Multiplatform (KMP):** Compartilhamento de lógica de negócio e modelos de dados.
* **Compose Multiplatform:** Interface de usuário declarativa compartilhada.
* **JavaScript (Vanilla):** Interface Web leve e performática.
* **Firebase Authentication:** Gestão de identidade e acesso seguro.
* **Firebase Firestore:** Armazenamento de certificados e trilhas de estudo.
* **GitLive Firebase SDK:** Integração multiplataforma para os serviços Firebase.

## 📱 Status das Funcionalidades

* ✅ **Autenticação:** Fluxo completo de Login e Cadastro integrado ao Firebase.
* ✅ **Dashboard Principal:** Interface moderna com progresso de perfil e recomendações.
* ✅ **Arquitetura Multiplataforma:** Estrutura pronta para escala em Android, iOS e Web.
* ✅ **UI Customizada:** Componentes visuais personalizados seguindo o design do projeto.

## 🚀 Como Rodar o Projeto

### Android
1. Adicione o `google-services.json` em `androidApp/`.
2. Execute a configuração `androidApp` no Android Studio.

### iOS
1. Adicione o `GoogleService-Info.plist` em `iosApp/`.
2. Abra `iosApp` no Xcode e instale as dependências via SPM.
3. Clique em Run.

### Web
1. Navegue até a pasta `webApp/`.
2. Abra o arquivo `index.html` em um navegador de sua preferência.

### Fluxograma de Autenticação

```mermaid
graph TD
    A[Início: App/Web] --> B{Possui conta?}
    B -- Não --> C[Tela de Cadastro]
    B -- Sim --> D[Tela de Login]
    C --> E[Firebase Auth: Criar Usuário]
    D --> F[Firebase Auth: Validar Acesso]
    E --> G[Salvar Perfil no Firestore]
    F --> H[Carregar Dashboard]
    G --> H
    H --> I[Exibir Recomendações de Carreira]
