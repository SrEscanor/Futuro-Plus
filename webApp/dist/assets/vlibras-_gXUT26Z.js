const o="https://vlibras.gov.br/app",a=`
    @media (max-width: 1023px) {
        #vlibras-access {
            top: auto;
            right: auto;
            bottom: 45px;
            left: 25px;
            flex-direction: row-reverse;
        }

        #vlibras-button {
            right: auto;
            left: 0;
        }
    }

    @media (max-width: 640px) {
        #vlibras-access {
            bottom: 35px;
        }
    }`;function r(){const t=document.getElementById("vlibras-access-wrapper")?.shadowRoot;if(!t||t.getElementById("futuroplus-posicao"))return!!t;const e=document.createElement("style");return e.id="futuroplus-posicao",e.textContent=a,t.appendChild(e),!0}function i(){if(document.getElementById("vlibras-carregador"))return;const t=()=>{const e=document.createElement("script");e.id="vlibras-carregador",e.src=`${o}/vlibras-plugin.js`,e.async=!0,e.onload=()=>{window.VLibras?.Widget&&new window.VLibras.Widget(o),r()||setTimeout(r,300)},e.onerror=()=>console.warn("Não deu para carregar o VLibras agora."),document.head.appendChild(e)};document.readyState==="complete"?setTimeout(t,0):window.addEventListener("load",t,{once:!0})}export{i as a};
