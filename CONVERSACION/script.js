const API_KEY = 'AIzaSyCJBD0mvr-2Ja261IjYT1TBkhxRydc3vUQ';
const URL_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const PROMPT_ATEO = `
Eres una IA que representa una perspectiva atea.
Responde de forma breve (máximo 3 oraciones), clara y fácil de entender.
Usa lenguaje simple, sin tecnicismos innecesarios.
`;

const PROMPT_CREYENTE = `
Eres una IA que representa una perspectiva creyente.
Responde de forma breve (máximo 3 oraciones), clara y fácil de entender.
Usa lenguaje simple, sin tecnicismos innecesarios.
`;

const areaMensajes = document.getElementById('area-mensajes');
const botonIniciar = document.getElementById('boton-iniciar');
const botonLimpiar = document.getElementById('boton-limpiar');
const mensajeCargando = document.getElementById('mensaje-cargando');
const mensajeError = document.getElementById('mensaje-error');

// Cuando la página se carga, se asignan los eventos a los botones
document.addEventListener('DOMContentLoaded', () => {
    botonIniciar.addEventListener('click', iniciarDebateAutomatico);
    botonLimpiar.addEventListener('click', limpiarChat);
});

async function obtenerRespuestaGemini(prompt, mensaje) {
    try {
        // Se hace la petición HTTP tipo POST con fetch
        const respuesta = await fetch(`${URL_API}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${prompt}\n\nEl usuario pregunta: ${mensaje}` }]
                }],
                generationConfig: {
                    maxOutputTokens: 80,  
                    temperature: 0.7        
                }
            })
        });

        // error 
        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            throw new Error(errorData.error?.message || `Error HTTP: ${respuesta.status}`);
        }

        // convierte respuesta a JSON
        const datos = await respuesta.json();

        // Se extrae el texto generado por la IA
        if (datos.candidates && datos.candidates[0].content.parts[0].text) {
            return datos.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Respuesta inesperada de la API');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Función que agrega un mensaje en la interfaz 
function agregarMensaje(tipo, texto) {
    const divMensaje = document.createElement('div');
    divMensaje.classList.add('mensaje');

    if (tipo === 'ateo') {
        divMensaje.classList.add('ateo-mensaje');
        divMensaje.innerHTML = `
            <div class="remitente">ATEO</div>
            <div class="contenido">${texto.replace('ATEO: ', '')}</div>
        `;
    } else if (tipo === 'creyente') {
        divMensaje.classList.add('creyente-mensaje');
        divMensaje.innerHTML = `
            <div class="remitente">CREYENTE</div>
            <div class="contenido">${texto.replace('CREYENTE: ', '')}</div>
        `;
    } else {
        divMensaje.classList.add('mensaje-usuario');
        divMensaje.innerHTML = `
            <div class="remitente">Tema de debate</div>
            <div class="contenido">${texto.replace('Tema de debate: ', '')}</div>
        `;
    }

    // Se agrega al área de mensajes y se hace scroll hacia abajo
    areaMensajes.appendChild(divMensaje);
    areaMensajes.scrollTop = areaMensajes.scrollHeight;
}


async function iniciarDebateAutomatico() {
    mostrarCargando(true);
    botonIniciar.disabled = true; // Desactiva botón mientras carga la charla 

    const temas = [
        "¿Existe evidencia suficiente para afirmar o negar la existencia de Dios?",
        "¿Puede la ciencia explicar todo lo que existe en el universo?",
        "¿La moralidad viene de Dios o es una construcción humana?",
        "¿Cómo explican el origen del universo las perspectivas ateas y creyentes?",
        "¿Puede la fe coexistir con la razón científica?",
        "¿Qué evidencia tendría que existir para que aceptes la existencia de Dios?",
        "¿Cómo explicas la complejidad del universo sin un creador?",
        "¿La experiencia espiritual es suficiente prueba de la existencia de Dios?"
    ];

    // escoge tema automatico 
    const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];

    //  tema del chat
    agregarMensaje('usuario', `Tema de debate: ${temaAleatorio}`);

    try {
        // 1. Responde el ATEO
        const respuestaAteo = await obtenerRespuestaGemini(PROMPT_ATEO, temaAleatorio);
        if (respuestaAteo) {
            agregarMensaje('ateo', `ATEO: ${respuestaAteo}`);

            // 2. Responde el CREYENTE a lo que le dijo el ateo 
            const respuestaCreyente = await obtenerRespuestaGemini(PROMPT_CREYENTE, respuestaAteo);
            if (respuestaCreyente) {
                agregarMensaje('creyente', `CREYENTE: ${respuestaCreyente}`);

                // 3. Replica el ATEO
                const contraAteo = await obtenerRespuestaGemini(PROMPT_ATEO, respuestaCreyente);
                if (contraAteo) {
                    agregarMensaje('ateo', `ATEO: ${contraAteo}`);

                    // 4. Replica el CREYENTE
                    const contraCreyente = await obtenerRespuestaGemini(PROMPT_CREYENTE, contraAteo);
                    if (contraCreyente) {
                        agregarMensaje('creyente', `CREYENTE: ${contraCreyente}`);
                    }
                }
            }
        }
    } catch (error) {
        mostrarError(`Error en el debate: ${error.message}`);
    } finally {
        mostrarCargando(false); // Oculta mensaje cargando 
        botonIniciar.disabled = false; // Reactiva botón
    }
}

// Limpia el chat y muestra un mensaje inicial de presentación
function limpiarChat() {
    areaMensajes.innerHTML = `
        <div class="mensaje ateo-mensaje">
            <div class="remitente">ATEO</div>
            <div class="contenido">Hola, soy el ATEO. Hablo con lógica y ciencia.</div>
        </div>
        <div class="mensaje creyente-mensaje">
            <div class="remitente">CREYENTE</div>
            <div class="contenido">Hola, soy el CREYENTE. Hablo con fe y espiritualidad.</div>
        </div>
    `;
}

// Muestra y oculta el indicador de "cargando"
function mostrarCargando(mostrar) {
    mensajeCargando.style.display = mostrar ? 'block' : 'none';
}

// Muestra un mensaje de error durante 5 segundos
function mostrarError(texto) {
    mensajeError.textContent = texto;
    mensajeError.style.display = 'block';
    setTimeout(() => {
        mensajeError.style.display = 'none';
    }, 5000);
}
