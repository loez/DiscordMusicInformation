const Discord = require("discord.js");
const client = new Discord.Client();
const request = require("request");
const configuracao = require("./config.json")
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-sr');
let audioplay;
let disparador;
let volumeMusica = 0.1;
let listamusicas = [];
let pedidosProxima = [];

const options = {
    url: 'https://api.deezer.com/user/' + configuracao.DeezerUser + '/history&access_token=' + configuracao.DeezerToken + '&expires=0'
};

function RetornaMusica(musicaAtual) {
    const canal = client.channels.cache.get(configuracao.CanalID);
    const Embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(musicaAtual.titulo)
        .setDescription(musicaAtual.artista)
        .setURL(musicaAtual.link)
        .setImage(musicaAtual.capa);

    client.user.setActivity(musicaAtual.nomeArtista, {type: "LISTENING"})
        .then(() => {
            if (configuracao.SendMensagem) {
                canal.send(Embed);
            }

        })
}


function musicaTime(time) {
    setTimeout(function () {
        musica((musicaAtual) => {
                RetornaMusica(musicaAtual);
                musicaTime(musicaAtual.time * 1000);
            }
        )
    }, time);
}


function musica(callback) {
    request(options,
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                let json = JSON.parse(body),
                    musica = json["data"][0],
                    arrayRetorno = {
                        'titulo': musica["title"],
                        'artista': musica["artist"]["name"],
                        'capa': musica["album"]["cover_medium"],
                        'link': musica["link"],
                        'nomeArtista': musica["title"] + " - " + musica["artist"]["name"],
                        'time': musica["duration"],
                        'preview': musica["preview"]
                    };

                callback(arrayRetorno);
            } else {
                callback(null);
            }
        }
    );
}

client.login(configuracao.DiscordToken)
    .then(() => {
        setTimeout(async function () {

            musicaTime(0);
        }, 10000);

    });

client.on('message', async msg => {
    if (msg.content.startsWith('!') && msg.content.includes('youtu')) {
        if (listamusicas.length <= 0) {
            audioplay = await client.channels.cache.get(configuracao.CanalAudio).join();
            listamusicas.push(msg.content.split("!")[1].trim())
            proximamusica(listamusicas[0].trim(), listamusicas);
        } else {
            listamusicas.push(msg.content.split("!")[1].trim());
        }
    }
    if (msg.content.includes('!proxima')) {
        if (!pedidosProxima.find(x => x === msg.author.id)) {
            pedidosProxima.push(msg.author.id);
            listamusicas.shift();
            if (listamusicas.length >0){
                proximamusica(listamusicas[0].trim(), listamusicas);
            }else{
                audioplay.disconnect();
            }

        }
    }
    if (msg.content.includes('!volume+')) {
        if (volumeMusica < 1.0) {
            volumeMusica += 0.1;
            disparador.setVolume(volumeMusica);
        }
    }
    if (msg.content.includes('!volume-')) {
        if (volumeMusica > 0.1) {
            volumeMusica -= 0.1;
            disparador.setVolume(volumeMusica);
        }
    }
    if (msg.content.includes('!busca')) {
        retornaMusicaYoutube(msg.content.split('!busca')[1].trimStart())
            .then(async (retornoBusca) => {
                if (listamusicas.length <= 0) {
                    audioplay = await client.channels.cache.get(configuracao.CanalAudio).join();
                    listamusicas.push(retornoBusca)
                    proximamusica(listamusicas[0], listamusicas);
                } else {
                    listamusicas.push(retornoBusca);
                }
            })
    }

});

const proximamusica = (link, listamusicas) => new Promise(async(sucess, reject) => {
    if (listamusicas.length > 0) {
        console.log(link);

         await ytdl.getInfo(link)
            .then((info) => {
                 client.user.setActivity(info.videoDetails.title, {type: "LISTENING"});
            })
             .catch((error) => {
                 console.log(error);
             })

        disparador = audioplay.play(ytdl(link, {filter: 'audioonly', highWaterMark: 1 << 25}), {volume: volumeMusica})
            .on('finish', () => {
                listamusicas.shift();
                if (listamusicas.length === 0) {
                    audioplay.disconnect();
                    pedidosProxima = [];
                } else {
                    sucess(proximamusica(listamusicas[0], listamusicas));
                }
            })
            .on('error', (erro) => {
                reject(erro);
                console.log(erro);
            })
    }
});
const retornaMusicaYoutube = (busca) => new Promise((success) => {
    youtubeSearch.search(busca, {limit: 1})
        .then(x => {
            let urlVideo = x[0].id;
            success(urlVideo);
        })
        .catch(console.error);
});