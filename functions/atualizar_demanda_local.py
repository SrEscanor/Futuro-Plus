"""Atualiza a demanda do vestibular (Etec e Fatec) rodando da sua máquina.

Por quê: o site do vestibular (atrás de Cloudflare) bloqueia com 403 as
requisições vindas do IP da Cloud Function (datacenter do Google), mas aceita
as de uma rede comum. Este script faz a mesma coisa que o botão "Atualizar
demanda" do painel Admin · Cursos — só que a busca roda aqui, e a gravação no
Firestore é direta (sem passar pela função nem pelo navegador).

Configuração única (só na primeira vez):
  1. Console do Firebase > Configurações do projeto > Contas de serviço >
     "Gerar nova chave privada" — baixa um arquivo .json.
  2. Guarde esse arquivo fora da pasta do projeto (ele dá acesso total ao
     Firestore: nunca commitar, nunca colocar dentro de webApp/ ou functions/
     onde o Git ou o deploy possam pegar).

Uso (da pasta functions/, com o venv ativado):
    python atualizar_demanda_local.py --credencial "C:\\caminho\\para\\chave.json"

Opções:
    --site etec|fatec     só um site (padrão: os dois)
    --semestre 20261      só esse semestre (padrão: decide sozinho, igual o
                           painel admin — o mais novo de cada site sempre, os
                           demais só se ainda não tiverem sido coletados)
    --refazer             recoleta mesmo o que já tem (útil depois de incluir
                           cursos novos no catálogo)
"""
import argparse
import sys

import firebase_admin
from firebase_admin import credentials, firestore

import demanda
import demanda_firestore

NOME_DO_SITE = {"etec": "Etec", "fatec": "Fatec"}

# Mesma regra do admin-cursos.js: só o 1º semestre entra (o 2º não oferece os
# cursos integrados), e não precisa olhar mais que uns 5 anos pra trás.
ANOS_DE_DEMANDA = 5


def alvos_do_site(site, db):
    """[(semestre, já_tem_dado)], do mais novo pro mais antigo."""
    disponiveis = [s for s in demanda.listar_semestres(site) if s.endswith("1")][:ANOS_DE_DEMANDA]
    coletados = {
        doc.id.split("-", 1)[1]
        for doc in db.collection("demanda").stream()
        if doc.id.startswith(f"{site}-")
    }
    return [(semestre, semestre in coletados) for semestre in disponiveis]


def atualizar(db, site, semestre, refazer):
    rotulo = f"{NOME_DO_SITE[site]} {semestre[:4]}"
    print(f"Coletando {rotulo}...")

    def progresso(feitas, total):
        print(f"\r  {feitas} de {total} unidades", end="", file=sys.stderr)

    coleta = demanda.coletar(site, semestre, progresso)
    print(file=sys.stderr)
    if not coleta["unidades"]:
        print(f"  {rotulo}: o site não devolveu nenhuma unidade para esse semestre.")
        return False

    resumo = demanda_firestore.gravar_coleta(db, site, semestre, coleta)
    print(f"  {rotulo}: {resumo['cursos']} curso(s), {resumo['unidades']} unidade(s), "
          f"{len(resumo['falhas'])} falha(s), {len(resumo['semPar'])} sem par no catálogo.")
    return True


def main():
    argumentos = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    argumentos.add_argument("--credencial", help="caminho da chave de conta de serviço (.json). "
                             "Se não informar, usa a credencial padrão do ambiente (GOOGLE_APPLICATION_CREDENTIALS).")
    argumentos.add_argument("--site", choices=sorted(NOME_DO_SITE), help="só esse site (padrão: etec e fatec)")
    argumentos.add_argument("--semestre", help='só esse semestre, ex.: "20261" (padrão: decide sozinho)')
    argumentos.add_argument("--refazer", action="store_true", help="recoleta mesmo o que já tem")
    opcoes = argumentos.parse_args()

    if not firebase_admin._apps:
        app_credencial = credentials.Certificate(opcoes.credencial) if opcoes.credencial else None
        firebase_admin.initialize_app(app_credencial)
    db = firestore.client()

    sites = [opcoes.site] if opcoes.site else sorted(NOME_DO_SITE)
    tarefas = []
    for site in sites:
        if opcoes.semestre:
            tarefas.append((site, opcoes.semestre))
            continue
        for indice, (semestre, ja_tem) in enumerate(alvos_do_site(site, db)):
            # O ano mais novo é sempre buscado de novo: é o que muda.
            if opcoes.refazer or indice == 0 or not ja_tem:
                tarefas.append((site, semestre))

    if not tarefas:
        print("Nenhum semestre para coletar (os sites não listaram nada).")
        return

    sucesso = 0
    for site, semestre in tarefas:
        if atualizar(db, site, semestre, opcoes.refazer):
            sucesso += 1
    print(f"\n{sucesso} de {len(tarefas)} coleta(s) com sucesso.")


if __name__ == "__main__":
    main()
