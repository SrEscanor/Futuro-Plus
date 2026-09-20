from dataclasses import dataclass, field


@dataclass
class ContextoChat:
    """Dados de uma chamada do chatbot, compartilhados com as ferramentas.

    `acoes_para_interface` é como uma ferramenta pede algo à tela do site
    (ex.: mostrar os botões de permissão de localização). A decisão fica
    com o clique do usuário, nunca com o modelo interpretando o texto.

    `links_para_interface` são botões para páginas do próprio site, montados
    pelas ferramentas (e não digitados pelo modelo), para o endereço nunca
    sair errado nem apontar para fora do site.
    """

    id_usuario: str
    acoes_para_interface: list[str] = field(default_factory=list)
    links_para_interface: list[dict] = field(default_factory=list)

    def pedir_acao(self, acao: str) -> None:
        if acao not in self.acoes_para_interface:
            self.acoes_para_interface.append(acao)

    def sugerir_link(self, texto: str, url: str) -> None:
        if all(link["url"] != url for link in self.links_para_interface):
            self.links_para_interface.append({"texto": texto, "url": url})
