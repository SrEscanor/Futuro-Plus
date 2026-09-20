import { normalizar } from './card-unidade.js';

// Converte endereços em coordenadas usando o Nominatim (OpenStreetMap).
// Regras de uso do serviço: no máximo 1 consulta por segundo e identificação
// da aplicação — por isso a fila abaixo e o e-mail de contato (o mesmo que
// já é público no rodapé do site).
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const CONTATO = 'contato.futuromais@gmail.com';
const INTERVALO_MS = 1100;

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let filaDeConsultas = Promise.resolve();

function consultarNominatim(parametros) {
    const consulta = filaDeConsultas.then(async () => {
        const url = `${NOMINATIM}?${new URLSearchParams({
            format: 'jsonv2', limit: '3', addressdetails: '1', countrycodes: 'br', email: CONTATO, ...parametros
        })}`;
        try {
            const resposta = await fetch(url);
            return resposta.ok ? await resposta.json() : [];
        } catch {
            return [];
        }
    });
    filaDeConsultas = consulta.then(() => esperar(INTERVALO_MS));
    return consulta;
}

const ABREVIACOES = [
    [/^av\.?\s/i, 'Avenida '], [/^r\.\s/i, 'Rua '], [/^al\.?\s/i, 'Alameda '], [/^est\.?\s/i, 'Estrada '],
    [/^rod\.?\s/i, 'Rodovia '], [/^p[çc]a\.?\s/i, 'Praça '], [/^tv\.?\s/i, 'Travessa '],
    [/\bcel\.\s/gi, 'Coronel '], [/\bdr\.\s/gi, 'Doutor '], [/\bprofa\.\s/gi, 'Professora '], [/\bprof\.\s/gi, 'Professor '],
    [/\bpref\.\s/gi, 'Prefeito '], [/\bdep\.\s/gi, 'Deputado '], [/\beng\.\s/gi, 'Engenheiro '], [/\bpe\.\s/gi, 'Padre '],
    [/\bsen\.\s/gi, 'Senador '], [/\bgov\.\s/gi, 'Governador '], [/\bdes\.\s/gi, 'Desembargador '],
    [/\bsta\.\s/gi, 'Santa '], [/\bsto\.\s/gi, 'Santo ']
];

// "Rua Nova Granada, 35 - Casa Verde - CEP: 02522-050 - São Paulo/SP"
//   -> { rua: "Rua Nova Granada", numero: "35" }
export function decomporEndereco(endereco) {
    const primeiroTrecho = (endereco || '').split(/\s[-–]\s/)[0];
    const partes = primeiroTrecho.split(',').map((p) => p.trim());
    let rua = partes[0] || '';
    ABREVIACOES.forEach(([padrao, extenso]) => { rua = rua.replace(padrao, extenso); });
    const numero = (partes[1] || '').match(/^\d+/)?.[0] || '';
    return { rua: rua.trim(), numero };
}

function cidadeDoResultado(resultado) {
    const a = resultado.address || {};
    return a.city || a.town || a.village || a.municipality || '';
}

const arredondar = (valor, casas) => Number(Number(valor).toFixed(casas));

// Tenta, do mais preciso para o menos: o próprio prédio da escola (muitas
// Etecs estão mapeadas no OSM), rua + número, só a rua e, por fim, o centro
// da cidade. Todo resultado precisa cair no município da unidade, senão é
// descartado — evita pegar uma rua homônima em outra cidade.
export async function localizarUnidade(unidade) {
    const municipio = unidade.municipio || '';
    const naCidadeCerta = (r) => normalizar(cidadeDoResultado(r)) === normalizar(municipio);
    const { rua, numero } = decomporEndereco(unidade.endereco);

    const tentativas = [
        {
            precisao: 'escola',
            parametros: { q: `${unidade.nome}, ${municipio}, SP` },
            aceitar: (r) => naCidadeCerta(r) && ['school', 'college', 'university'].includes(r.type)
        },
        rua && numero && { precisao: 'numero', parametros: { street: `${numero} ${rua}`, city: municipio, state: 'São Paulo' }, aceitar: naCidadeCerta },
        rua && { precisao: 'rua', parametros: { street: rua, city: municipio, state: 'São Paulo' }, aceitar: naCidadeCerta },
        { precisao: 'cidade', parametros: { city: municipio, state: 'São Paulo' }, aceitar: naCidadeCerta }
    ].filter(Boolean);

    for (const tentativa of tentativas) {
        const encontrado = (await consultarNominatim(tentativa.parametros)).find(tentativa.aceitar);
        if (encontrado) {
            return {
                lat: arredondar(encontrado.lat, 5),
                lng: arredondar(encontrado.lon, 5),
                precisao: tentativa.precisao,
                endereco: unidade.endereco || ''
            };
        }
    }
    return null;
}

// Do aluno só vão a rua e a cidade (nunca o número da casa), e a coordenada
// é guardada arredondada em 3 casas (~100 m): basta para comparar distâncias
// até as Etecs sem registrar onde exatamente a pessoa mora.
export async function localizarRuaDoAluno({ rua, cidade, uf = 'SP' }) {
    if (!cidade) return null;
    const naCidadeCerta = (r) => normalizar(cidadeDoResultado(r)) === normalizar(cidade);

    if (rua) {
        const pelaRua = (await consultarNominatim({ street: rua, city: cidade, state: uf })).find(naCidadeCerta);
        if (pelaRua) return { lat: arredondar(pelaRua.lat, 3), lng: arredondar(pelaRua.lon, 3), precisao: 'rua' };
    }

    const pelaCidade = (await consultarNominatim({ city: cidade, state: uf })).find(naCidadeCerta);
    if (pelaCidade) return { lat: arredondar(pelaCidade.lat, 3), lng: arredondar(pelaCidade.lon, 3), precisao: 'cidade' };

    return null;
}

// Distância em linha reta (fórmula de Haversine), em km.
export function distanciaKm(a, b) {
    if (!a || !b || a.lat == null || b.lat == null) return null;
    const rad = (graus) => (graus * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function formatarDistancia(km) {
    if (km == null) return '';
    if (km < 1) return 'a menos de 1 km';
    return `a ${km.toLocaleString('pt-BR', { maximumFractionDigits: km < 10 ? 1 : 0 })} km`;
}
