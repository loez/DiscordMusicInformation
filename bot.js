const Discord = require("discord.js");
const client = new Discord.Client();
const configuracao = require("./config.json")
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-sr');

let audioplay;
let disparador;
let volumeMusica = 0.1;
let listamusicas = [];
let pedidosProxima = [];
let pedidosdoFabricio = [];
let canalTexto;
let idFabricio = 691768022951526581;

client.login(configuracao.DiscordToken)
    .then(async () => {
        console.log('Conectado');
    });

client.on('message', async msg => {
    canalTexto = await client.channels.cache.get('773856165158453258');

    if (msg.content.startsWith('!') && msg.content.includes('youtu')) {
        if (!(msg.author.id === idFabricio)) {

            if (listamusicas.length <= 0) {
                audioplay = await client.channels.cache.get(msg.member.voice.channel.id === null ? configuracao.CanalAudio : msg.member.voice.channel.id).join();
                listamusicas.push({ 'link': msg.content.split("!")[1].trim(), 'canal': msg.member.voice.channel.id === null ? configuracao.CanalAudio : msg.member.voice.channel.id });
                proximaMusica(listamusicas[0], listamusicas);
            } else {
                listamusicas.push({ 'link': msg.content.split("!")[1].trim(), 'canal': msg.member.voice.channel.id === null ? configuracao.CanalAudio : msg.member.voice.channel.id });
            }
        } else {

            if (pedidosdoFabricio <= 2) {

                if (listamusicas.length <= 0) {
                    audioplay = await client.channels.cache.get(msg.member.voice.channel.id === null ? configuracao.CanalAudio : msg.member.voice.channel.id).join();
                    listamusicas.push({ 'link': msg.content.split("!")[1].trim(), 'canal': msg.member.voice.channel.id === null ? configuracao.CanalAudio : msg.member.voice.channel.id });
                    proximaMusica(listamusicas[0], listamusicas);
                } else {
                    listamusicas.push({ 'link': msg.content.split("!")[1].trim(), 'canal': msg.member.voice.channel.id === null ? configuracao.CanalAudio : msg.member.voice.channel.id });
                }

                pedidosdoFabricio.push(msg.author.lastMessage);

            } else {
                canalTexto.send('Chega Fabrício!');
            }
        }

    }

    if (msg.content.toLocaleLowerCase() === '!volume') {
        canalTexto.send('Volume atual é ' + volumeMusica.toString())
    }

    if (msg.content.includes('!proxima')) {
        if (!pedidosProxima.find(x => x === msg.author.id)) {
            pedidosProxima.push(msg.author.id);
            listamusicas.shift();
            if (listamusicas.length > 0) {
                proximaMusica(listamusicas[0], listamusicas);
            } else {
                audioplay.disconnect();
            }

        }
    }

    if (msg.content.includes('!volume+')) {
        if (volumeMusica < 1.0) {
            volumeMusica += 0.1;
            disparador.setVolume(volumeMusica);
            canalTexto.send('Volume atual é ' + volumeMusica.toFixed(2))
        }
    }

    if (msg.content.includes('!volume-')) {
        if (volumeMusica > 0.1) {
            volumeMusica -= 0.1;
            disparador.setVolume(volumeMusica);
            canalTexto.send('Volume atual é ' + volumeMusica.toFixed(2))
        }
    }

    if (msg.content.includes('!busca')) {
        retornaMusicaYoutube(msg.content.split('!busca')[1].trimStart())
            .then(async (retornoBusca) => {
                if (listamusicas.length <= 0) {
                    audioplay = await client.channels.cache.get(msg.member.voice.channel.id === null ? configuracao.CanalAudio : msg.member.voice.channel.id).join();
                    listamusicas.push(retornoBusca)
                    proximaMusica(listamusicas[0], listamusicas);
                } else {
                    listamusicas.push({ 'link': retornoBusca, 'canal': msg.member.voice.channel.id === null ? configuracao.CanalAudio : msg.member.voice.channel.id });
                }
            }
            );
    }

    if (msg.content.includes('!reset') && (msg.author.id === '745653678853324983' || msg.author.id === '691767726456438805')) {
        pedidosdoFabricio = [];
    }

});

const proximaMusica = (link, listamusicas) => new Promise(async (sucess, reject) => {
    if (listamusicas.length > 0) {
        console.log(link['link']);
        await ytdl.getInfo(link['link'].trim())
            .then((info) => {
                client.user.setActivity(info.videoDetails.title, { type: "LISTENING" });
            })
            .catch((error) => {
                console.log(error);
            })
        audioplay = await client.channels.cache.get(link['canal'] === null ? configuracao.CanalAudio : link['canal']).join();

        disparador = audioplay.play(ytdl(link['link'].trim(), { filter: 'audioonly', highWaterMark: 1 << 25 }), { volume: volumeMusica })
            .on('finish', () => {
                listamusicas.shift();
                if (listamusicas.length === 0) {
                    client.user.setActivity('Esperando a próxima música', { type: "LISTENING" });
                    audioplay.disconnect();
                    pedidosProxima = [];
                } else {
                    sucess(proximaMusica(listamusicas[0], listamusicas));
                }
            })
            .on('error', (erro) => {
                listamusicas.shift();
                if (listamusicas.length === 0) {
                    client.user.setActivity('Esperando a próxima música', { type: "LISTENING" });
                    audioplay.disconnect();
                    pedidosProxima = [];
                } else {
                    reject(proximaMusica(listamusicas[0], listamusicas));
                }
                console.log(erro);
            })
    }
});

const retornaMusicaYoutube = (busca) => new Promise((success) => {
    youtubeSearch.default.search(busca, { limit: 1 })
        .then(x => {
            let urlVideo = x[0].id;
            success(urlVideo);
        })
        .catch(console.error);
});
