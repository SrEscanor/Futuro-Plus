# FuturoPlus 🚀

O **FuturoPlus** é um aplicativo educacional desenvolvido em **Kotlin Multiplatform (KMP)** e **Compose Multiplatform**, focado em ajudar usuários a alcançarem seu potencial máximo. O projeto utiliza uma única base de código para as plataformas **Android** e **iOS**, garantindo consistência visual e lógica.

## 🛠️ Tecnologias Utilizadas

- **Kotlin Multiplatform (KMP):** Compartilhamento de lógica de negócio entre plataformas.
- **Compose Multiplatform:** UI declarativa compartilhada para Android e iOS.
- **Firebase Authentication:** Sistema de login e cadastro seguro.
- **Firebase Firestore:** (Em implementação) Banco de dados em tempo real.
- **GitLive Firebase SDK:** Integração do Firebase nativa para KMP.

## 📱 Funcionalidades Implementadas

- [x] **Tela de Login:** Interface moderna com validação e tratamento de erros amigáveis.
- [x] **Tela de Cadastro:** Fluxo de criação de conta integrado ao Firebase.
- [x] **Main Screen:** Dashboard personalizado com:
  - Saudação dinâmica.
  - Barra de progresso do perfil.
  - Cards de cursos recomendados.
  - Navigation Bar customizada em formato de "pílula".
- [x] **Navegação:** Fluxo completo entre Login, Cadastro e Home.
- [x] **Suporte Multiplataforma:** Configuração completa para rodar no Android (Gradle) e iOS (Xcode/SPM).

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Android Studio Ladybug ou superior.
- Xcode 15+ (para rodar no iOS).
- Java 11 ou superior.

### Android
1. Certifique-se de ter o arquivo `google-services.json` em `androidApp/`.
2. Selecione a configuração `androidApp` no Android Studio e clique em **Run**.

### iOS
1. Certifique-se de ter o arquivo `GoogleService-Info.plist` em `iosApp/`.
2. Abra a pasta `iosApp` no Xcode.
3. Adicione as dependências do Firebase via Swift Package Manager (SPM).
4. Clique em **Play**.

---

## 📂 Estrutura do Projeto

- `androidApp/`: Código específico da plataforma Android.
- `iosApp/`: Projeto Xcode e código Swift para iOS.
- `shared/`: O "cérebro" do app. Contém a UI em Compose e toda a lógica do Firebase.
  - `commonMain/`: Código compartilhado por todas as plataformas.
  - `androidMain/` & `iosMain/`: Implementações específicas para Android e iOS.

---
Desenvolvido com ❤️ por Mateus Silva Mendes.
